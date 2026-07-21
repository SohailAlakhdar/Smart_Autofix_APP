import { FaultReportModel, FaultTypeEnum, FaultReportStatusEnum } from "../../DB/models/FaultReport.model.js";
import {
    destroyFile,
    deleteResources,
    deleteFolderByPrefix,
} from "../../utils/multer/cloudinary.js";
import { uploadFile } from "../../utils/multer/cloudinary.js";
import { uploadFiles } from "../../utils/multer/cloudinary.js";
import { findNearestServiceCenter, findNearestTowTruck } from "./fault.prompt.js";
/**
 * POST /api/faults/diagnose
 * body: { faultType, faultText?, vehicleInfo? }
 * file: req.file (image, optional - multer)
 */
export const diagnoseFault = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { faultType, faultText, lng, lat } = req.body;

        if (!Object.values(FaultTypeEnum).includes(faultType)) {
            return res.status(400).json({ success: false, message: "Invalid faultType" });
        }
        if (faultType === FaultTypeEnum.text && !faultText) {
            return res.status(400).json({ success: false, message: "faultText is required" });
        }
        if (faultType === FaultTypeEnum.image && !req.file) {
            return res.status(400).json({ success: false, message: "Image file is required" });
        }

        let faultImage = null;
        if (req.file) {
            const { secure_url, public_id } = await uploadFile(req.file.path, {
                folder: `SmartAutofix/faults/${userId}`,
            });
            faultImage = { secure_url, public_id };
        }

        const aiResult = await analyzeFault({
            faultType,
            faultText,
            faultImageUrl: faultImage?.secure_url,
        });

        const isHard = aiResult.difficulty === "hard";
        let nearestServiceCenter = null;
        let nearestTowTruck = null;

        if (isHard && lng && lat) {
            const coords = [parseFloat(lng), parseFloat(lat)];
            [nearestServiceCenter, nearestTowTruck] = await Promise.all([
                findNearestServiceCenter(coords),
                findNearestTowTruck(coords),
            ]);
        }

        const faultReport = await FaultReportModel.create({
            userId,
            faultType,
            faultText: faultText || null,
            faultImage,
            aiResult,
            status: isHard ? FaultReportStatusEnum.needs_technician : FaultReportStatusEnum.resolved_by_user,
            nearestServiceCenter,
            nearestTowTruck,
        });

        return res.status(201).json({ success: true, data: faultReport });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/faults/history
 * query: page, limit
 */
export const getFaultHistory = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10 } = req.query;

        const faults = await FaultReportModel.find({ userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(+limit);

        const total = await FaultReportModel.countDocuments({ userId });

        return res.status(200).json({
            success: true,
            data: faults,
            pagination: { page: +page, limit: +limit, total },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/faults/:id
 */
export const getFaultById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const fault = await FaultReportModel.findOne({ _id: id, userId: req.user._id })
            .populate("nearestServiceCenter.refId", "name phone location")
            .populate("nearestTowTruck.refId", "name phone location");

        if (!fault) {
            return res.status(404).json({ success: false, message: "Fault report not found" });
        }

        return res.status(200).json({ success: true, data: fault });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/faults/:id
 */
export const deleteFault = async (req, res, next) => {
    try {
        const { id } = req.params;
        const fault = await FaultReportModel.findOneAndDelete({ _id: id, userId: req.user._id });

        if (!fault) {
            return res.status(404).json({ success: false, message: "Fault report not found" });
        }

        if (fault.faultImage?.public_id) {
            await cloudinary.uploader.destroy(fault.faultImage.public_id);
        }

        return res.status(200).json({ success: true, message: "Fault report deleted" });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/faults/:id/feedback
 * body: { wasHelpful, rating, comment }
 */
export const submitFeedback = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { wasHelpful, rating, comment } = req.body;

        if (rating !== undefined && (rating < 1 || rating > 5)) {
            return res.status(400).json({ success: false, message: "rating must be between 1 and 5" });
        }

        const fault = await FaultReportModel.findOneAndUpdate(
            { _id: id, userId: req.user._id },
            { $set: { userFeedback: { wasHelpful, rating, comment } } },
            { new: true }
        );

        if (!fault) {
            return res.status(404).json({ success: false, message: "Fault report not found" });
        }

        return res.status(200).json({ success: true, data: fault });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/faults  (Admin)
 * query: difficulty, status, from, to, page, limit
 */
export const getAllFaults = async (req, res, next) => {
    try {
        const { difficulty, status, from, to, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (difficulty) filter["aiResult.difficulty"] = difficulty;
        if (status) filter.status = status;
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) filter.createdAt.$lte = new Date(to);
        }

        const faults = await FaultReportModel.find(filter)
            .populate("userId", "name email phone")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(+limit);

        const total = await FaultReportModel.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: faults,
            pagination: { page: +page, limit: +limit, total },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/faults/stats/common  (Admin)
 * Most frequent fault names + average confidence + difficulty breakdown
 */
export const getCommonFaultStats = async (req, res, next) => {
    try {
        const stats = await FaultReportModel.aggregate([
            {
                $group: {
                    _id: "$aiResult.faultName",
                    count: { $sum: 1 },
                    avgConfidence: { $avg: "$aiResult.confidence" },
                    difficulties: { $push: "$aiResult.difficulty" },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 20 },
        ]);

        return res.status(200).json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};
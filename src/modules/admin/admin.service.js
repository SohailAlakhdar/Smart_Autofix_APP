import { UserModel, roleEnum } from "../../DB/models/User.model.js";
import { ServiceCenterModel } from "../../DB/models/ServiceCenter.model.js";
import { TowTruckModel } from "../../DB/models/TowTruck.model.js";
import { FaultReportModel } from "../../DB/models/FaultReport.model.js";
import { RatingModel } from "../../DB/models/Rate.model.js";

// GET /api/admin/dashboard  (Admin only)
// Returns summary stats + recent records for each collection.
// "limit" (query param, default 20) caps how many records come back per
// list — an unbounded find({}) on every collection in one request doesn't
// scale once data grows. Raise/lower via ?limit=N, or use the existing
// dedicated list endpoints (/users, /service-centers, /tow-trucks, etc.)
// with their own pagination for full browsing.
export const getDashboard = async (req, res) => {
    const limit = Number(req.query.limit) || 20;

    const [
        totalUsers,
        frozenUsers,
        totalServiceCenters,
        frozenServiceCenters,
        totalTowTrucks,
        frozenTowTrucks,
        availableTowTrucks,
        totalFaultReports,
        easyFaults,
        mediumFaults,
        hardFaults,
        totalFeedback,
        recentUsers,
        recentServiceCenters,
        recentTowTrucks,
        recentFaultReports,
        recentFeedback,
    ] = await Promise.all([
        UserModel.countDocuments({ role: roleEnum.user }),
        UserModel.countDocuments({ role: roleEnum.user, freezedAt: { $ne: null } }),
        ServiceCenterModel.countDocuments({}),
        ServiceCenterModel.countDocuments({ freezedAt: { $ne: null } }),
        TowTruckModel.countDocuments({}),
        TowTruckModel.countDocuments({ freezedAt: { $ne: null } }),
        TowTruckModel.countDocuments({ isAvailable: true }),
        FaultReportModel.countDocuments({}),
        FaultReportModel.countDocuments({ difficulty: "easy" }),
        FaultReportModel.countDocuments({ difficulty: "medium" }),
        FaultReportModel.countDocuments({ difficulty: "hard" }),
        RatingModel.countDocuments({}),
        UserModel.find({ role: roleEnum.user })
            .select("-password")
            .sort({ createdAt: -1 })
            .limit(limit),
        ServiceCenterModel.find({}).sort({ createdAt: -1 }).limit(limit),
        TowTruckModel.find({}).sort({ createdAt: -1 }).limit(limit),
        FaultReportModel.find({})
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .limit(limit),
        RatingModel.find({}).sort({ createdAt: -1 }).limit(limit),
    ]);

    return res.json({
        success: true,
        data: {
            stats: {
                users: {
                    total: totalUsers,
                    active: totalUsers - frozenUsers,
                    frozen: frozenUsers,
                },
                serviceCenters: {
                    total: totalServiceCenters,
                    active: totalServiceCenters - frozenServiceCenters,
                    frozen: frozenServiceCenters,
                },
                towTrucks: {
                    total: totalTowTrucks,
                    active: totalTowTrucks - frozenTowTrucks,
                    frozen: frozenTowTrucks,
                    available: availableTowTrucks,
                },
                faultReports: {
                    total: totalFaultReports,
                    byDifficulty: {
                        easy: easyFaults,
                        medium: mediumFaults,
                        hard: hardFaults,
                    },
                },
                feedback: {
                    total: totalFeedback,
                },
            },
            recent: {
                users: recentUsers,
                serviceCenters: recentServiceCenters,
                towTrucks: recentTowTrucks,
                faultReports: recentFaultReports,
                feedback: recentFeedback,
            },
            limit,
        },
    });
};
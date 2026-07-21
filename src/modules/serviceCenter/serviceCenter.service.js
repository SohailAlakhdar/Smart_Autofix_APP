import { rateableTypeEnum, RatingModel } from "../../DB/models/rate.model.js";
import { ServiceCenterModel } from "../../DB/models/ServiceCenter.model.js";

// GET /service-centers  (Public)
export const listServiceCenters = async (req, res) => {
    const { city, specialty, page = 1, limit = 20 } = req.query;

    const filter = { freezedBy: null };
    if (city) filter["location.city"] = { $regex: city, $options: "i" };
    if (specialty) filter.specialties = { $in: [specialty] };

    const skip = (Number(page) - 1) * Number(limit);

    const [centers, total] = await Promise.all([
        ServiceCenterModel.find(filter)
            .sort({ "rating.average": -1 })
            .skip(skip)
            .limit(Number(limit)),
        ServiceCenterModel.countDocuments(filter),
    ]);

    return res.json({
        success: true,
        count: centers.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        data: centers,
    });
};

// GET /service-centers/nearby  (Private — any authenticated role)
export const nearbyServiceCenters = async (req, res) => {
    const { lat, lng, maxDistanceKm = 10, limit = 5, specialty } = req.query;

    const filter = {
        location: {
            $near: {
                $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
                $maxDistance: Number(maxDistanceKm) * 1000,
            },
        },
    };
    if (specialty) filter.specialties = { $in: [specialty] };

    const centers = await ServiceCenterModel.find(filter).limit(Number(limit));

    const originLat = Number(lat);
    const originLng = Number(lng);
    const data = centers.map((center) => {
        const [centerLng, centerLat] = center.location.coordinates;
        return {
            ...center.toObject(),
            distanceKm: Math.round(haversineKm(originLat, originLng, centerLat, centerLng) * 10) / 10,
        };
    });

    return res.json({ success: true, count: data.length, data });
};

// GET /service-centers/:id  (Public)
export const getServiceCenter = async (req, res) => {
    const center = await ServiceCenterModel.findOne({ _id: req.params.id, freezedBy: null });

    if (!center) {
        return res.status(404).json({ success: false, message: "Service center not found" });
    }

    return res.json({ success: true, data: center });
};

// POST /service-centers  (Admin)
export const createServiceCenter = async (req, res) => {
    const { name, phone, location, specialties, workingHours } = req.body;

    const center = await ServiceCenterModel.create({
        name,
        phone,
        location,
        specialties,
        workingHours,
    });

    return res.status(201).json({ success: true, data: center });
};

// PUT /service-centers/:id  (Admin)
export const updateServiceCenter = async (req, res) => {
    const allowedFields = ["name", "phone", "location", "specialties", "workingHours"];
    const updates = {};
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const center = await ServiceCenterModel.findOneAndUpdate(
        { _id: req.params.id, freezedBy: null },
        updates,
        { new: true, runValidators: true }
    );

    if (!center) {
        return res.status(404).json({ success: false, message: "Service center not found" });
    }

    return res.json({ success: true, data: center });
};

// DELETE /service-centers/:id  (Admin) — soft delete via freezedBy
export const deleteServiceCenter = async (req, res) => {
    const center = await ServiceCenterModel.findByIdAndUpdate(
        req.params.id,
        { freezedBy: req.user._id },
        { freezedAt: new Date() },
        { new: true }
    );

    if (!center) {
        return res.status(404).json({ success: false, message: "Service center not found" });
    }

    return res.json({ success: true, message: "Service center frozen", data: center });
};


//  POST /service-centers/:id/rate  (Private)
export const rateServiceCenter = async (req, res) => {
    const { rating } = req.body;

    const center = await ServiceCenterModel.findOne({ _id: req.params.id });
    if (!center) {
        return res.status(404).json({ success: false, message: "Service center not found" });
    }

    await RatingModel.findOneAndUpdate(
        {
            user: req.user._id,
            targetType: rateableTypeEnum.serviceCenter,
            targetId: center._id,
        },
        { rating },
        { upsert: true, new: true }
    );

    const allRatings = await RatingModel.find({
        targetType: rateableTypeEnum.serviceCenter,
        targetId: center._id,
    });

    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of allRatings) breakdown[r.rating] += 1;

    const total = allRatings.length;
    const sum = allRatings.reduce((acc, r) => acc + r.rating, 0);

    center.ratingsBreakdown = breakdown;
    center.ratingsCount = total;
    center.rating = total ? Math.round((sum / total) * 10) / 10 : 0;
    await center.save();

    return res.json({
        success: true,
        data: {
            ...center.toObject(),
        },
    });
};

function percentBreakdown(center) {
    const total = center.ratingsCount;
    return Object.fromEntries(
        Object.entries(center.ratingsBreakdown).map(([star, count]) => [
            star,
            total ? Math.round((count / total) * 100) : 0,
        ])
    );
}


function haversineKm(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
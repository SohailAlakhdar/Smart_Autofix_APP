import { TowTruckModel } from "../../DB/models/TowTruck.model.js";
import { TowRequestModel } from "../../DB/models/TowRequest.model.js";
import { RatingModel, rateableTypeEnum } from "../../DB/models/Rate.model.js";

// GET /tow-trucks  (Public)
export const listTowTrucks = async (req, res) => {
    const { page = 1, limit = 20, isAvailable } = req.query;

    const filter = {};
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === "true" || isAvailable === true;

    const skip = (Number(page) - 1) * Number(limit);

    const [trucks, total] = await Promise.all([
        TowTruckModel.find(filter).sort({ rating: -1 }).skip(skip).limit(Number(limit)),
        TowTruckModel.countDocuments(filter),
    ]);

    return res.json({
        success: true,
        count: trucks.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        data: trucks,
    });
};

// GET /tow-trucks/nearby  (Private — any authenticated role)
export const nearbyTowTrucks = async (req, res) => {
    const { lat, lng, maxDistanceKm = 10, limit = 5, onlyAvailable } = req.query;

    const filter = {
        location: {
            $near: {
                $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
                $maxDistance: Number(maxDistanceKm) * 1000,
            },
        },
    };
    // Defaults to true — when looking for a nearby tow truck you almost
    // always want ones that can actually take the job right now.
    if (onlyAvailable !== "false") filter.isAvailable = true;

    const trucks = await TowTruckModel.find(filter).limit(Number(limit));

    const originLat = Number(lat);
    const originLng = Number(lng);
    const data = trucks.map((truck) => {
        const [truckLng, truckLat] = truck.location.coordinates;
        return {
            ...truck.toObject(),
            distanceKm: Math.round(haversineKm(originLat, originLng, truckLat, truckLng) * 10) / 10,
        };
    });

    return res.json({ success: true, count: data.length, data });
};

// GET /tow-trucks/:id  (Public)
export const getTowTruck = async (req, res) => {
    const truck = await TowTruckModel.findOne({ _id: req.params.id });

    if (!truck) {
        return res.status(404).json({ success: false, message: "Tow truck not found" });
    }

    return res.json({
        success: true,
        data: { ...truck.toObject(), ratingsPercentBreakdown: percentBreakdown(truck) },
    });
};

// POST /tow-trucks  (Admin)
export const createTowTruck = async (req, res) => {
    const { name, phone, location } = req.body;

    const truck = await TowTruckModel.create({ name, phone, location });

    return res.status(201).json({ success: true, data: truck });
};

// PUT /tow-trucks/:id  (Admin)
export const updateTowTruck = async (req, res) => {
    const allowedFields = ["name", "phone", "location"];
    const updates = {};
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const truck = await TowTruckModel.findOneAndUpdate(
        { _id: req.params.id },
        updates,
        { new: true, runValidators: true }
    );

    if (!truck) {
        return res.status(404).json({ success: false, message: "Tow truck not found" });
    }

    return res.json({ success: true, data: truck });
};

// DELETE /tow-trucks/:id  (Admin) — soft delete via freezedBy/freezedAt
export const deleteTowTruck = async (req, res) => {
    const truck = await TowTruckModel.findByIdAndUpdate(
        req.params.id,
        { freezedBy: req.user._id, freezedAt: new Date() },
        { new: true }
    );

    if (!truck) {
        return res.status(404).json({ success: false, message: "Tow truck not found" });
    }

    return res.json({ success: true, message: "Tow truck frozen", data: truck });
};

// POST /tow-trucks/:id/request  (Private) — direct request, no fault report
export const requestTowTruck = async (req, res) => {
    const { location } = req.body;

    const truck = await TowTruckModel.findOne({ _id: req.params.id });
    if (!truck) {
        return res.status(404).json({ success: false, message: "Tow truck not found" });
    }

    if (!truck.isAvailable) {
        return res.status(409).json({ success: false, message: "This tow truck is currently busy" });
    }

    const request = await TowRequestModel.create({
        user: req.user._id,
        towTruck: truck._id,
        userLocation: location,
    });

    return res.status(201).json({
        success: true,
        data: {
            request,
            towTruck: { name: truck.name, phone: truck.phone, location: truck.location },
        },
    });
};

// PUT /tow-trucks/:id/availability  (Technician/Admin)
export const updateAvailability = async (req, res) => {
    const { isAvailable } = req.body;

    const truck = await TowTruckModel.findOneAndUpdate(
        { _id: req.params.id },
        { isAvailable },
        { new: true }
    );

    if (!truck) {
        return res.status(404).json({ success: false, message: "Tow truck not found" });
    }

    return res.json({ success: true, data: truck });
};

// POST /tow-trucks/:id/rate  (Private)
// Same upsert-and-recompute pattern used for ServiceCenter ratings.
export const rateTowTruck = async (req, res) => {
    const { rating } = req.body;

    const truck = await TowTruckModel.findOne({ _id: req.params.id });
    if (!truck) {
        return res.status(404).json({ success: false, message: "Tow truck not found" });
    }

    await RatingModel.findOneAndUpdate(
        { user: req.user._id, targetType: rateableTypeEnum.towTruck, targetId: truck._id },
        { rating },
        { upsert: true, new: true }
    );

    const allRatings = await RatingModel.find({
        targetType: rateableTypeEnum.towTruck,
        targetId: truck._id,
    });

    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of allRatings) breakdown[r.rating] += 1;

    const total = allRatings.length;
    const sum = allRatings.reduce((acc, r) => acc + r.rating, 0);

    truck.ratingsBreakdown = breakdown;
    truck.ratingsCount = total;
    truck.rating = total ? Math.round((sum / total) * 10) / 10 : 0;
    await truck.save();

    return res.json({
        success: true,
        data: { ...truck.toObject(), ratingsPercentBreakdown: percentBreakdown(truck) },
    });
};

function percentBreakdown(truck) {
    const total = truck.ratingsCount;
    return Object.fromEntries(
        Object.entries(truck.ratingsBreakdown).map(([star, count]) => [
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
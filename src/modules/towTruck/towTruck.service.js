import { TowTruckModel } from "../../DB/models/TowTruck.model.js";
import { RatingModel, rateableTypeEnum } from "../../DB/models/Rate.model.js";

// GET /tow-trucks  (Public)
export const listTowTrucks = async (req, res) => {
    const { page = 1, limit = 20, isAvailable } = req.query;

    // FIX: no freeze filter previously — a frozen truck was fully visible
    // in the public listing. Hidden from public views the same way
    // serviceCenter now does it.
    const filter = { freezedAt: null };
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

// GET /tow-trucks/nearby  (Public — no auth, no fault, no image required)
export const nearbyTowTrucks = async (req, res) => {
    const { lat, lng, maxDistanceKm = 10, limit = 5, onlyAvailable } = req.query;

    const filter = {
        freezedAt: null, // FIX: frozen trucks were previously returned in nearby search
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
    // FIX: previously had no freeze filter — a frozen truck's details
    // stayed fully visible to the public.
    const truck = await TowTruckModel.findOne({ _id: req.params.id, freezedAt: null });

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

// PUT /tow-trucks/:id  (Admin) — intentionally NOT filtered by freezedAt,
// so admin can still edit a frozen truck's details before unfreezing it.
// See note about aligning this policy with serviceCenter.
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

// PATCH /tow-trucks/:id/unfreeze  (Admin) — was missing entirely; section 22
// lists Unfreeze alongside Freeze for Tow Trucks.
export const unfreezeTowTruck = async (req, res) => {
    const truck = await TowTruckModel.findByIdAndUpdate(
        req.params.id,
        { freezedBy: null, freezedAt: null },
        { new: true }
    );

    if (!truck) {
        return res.status(404).json({ success: false, message: "Tow truck not found" });
    }

    return res.json({ success: true, message: "Tow truck unfrozen", data: truck });
};


// POST /tow-trucks/:id/rate  (Private — requires auth)
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
    // FIX: ratingsBreakdown can be undefined on a never-rated truck —
    // Object.entries(undefined) throws. Default to {} instead.
    return Object.fromEntries(
        Object.entries(truck.ratingsBreakdown ?? {}).map(([star, count]) => [
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
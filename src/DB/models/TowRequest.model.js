import mongoose, { Schema, model } from "mongoose";

// Records a direct tow-truck request (no fault report attached).
// Kept intentionally minimal — status tracking, ETA, etc. can be added
// later without touching the request endpoint's core shape.
const towRequestSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        towTruck: {
            type: Schema.Types.ObjectId,
            ref: "TowTruck",
            required: true,
        },
        // Where the user was when they requested — useful even though the
        // truck itself has a location, since the user's position is what
        // the driver actually needs to navigate to.
        userLocation: {
            type: { type: String, enum: ["Point"], default: "Point" },
            coordinates: { type: [Number] }, // [lng, lat]
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "completed", "cancelled"],
            default: "pending",
        },
    },
    { timestamps: true }
);

towRequestSchema.index({ towTruck: 1, createdAt: -1 });

export const TowRequestModel =
    mongoose.models.TowRequest || model("TowRequest", towRequestSchema);
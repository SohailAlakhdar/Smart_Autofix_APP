import mongoose, { Schema, model } from "mongoose";

// Which model names this Rating is allowed to point at. Add to this list
// as you rate more things later — the schema itself doesn't need to change.
export const rateableTypeEnum = {
    serviceCenter: "ServiceCenter",
    towTruck: "TowTruck",
    faultReport: "FaultReport",
};

const ratingSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // The rated document's id...
        targetId: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: "targetType", // ...resolved dynamically via this field
        },
        // ...and which model it lives in, so populate('targetId') knows
        // whether to look in ServiceCenter, TowTruck, or FaultReport.
        targetType: {
            type: String,
            required: true,
            enum: Object.values(rateableTypeEnum),
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: true,
        },
    },
    { timestamps: true }
);

// One rating per user per target, regardless of target type — re-rating
// updates this same document instead of creating a second one.
ratingSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

// Fast lookup of "all ratings for this service center / tow truck / fault report"
ratingSchema.index({ targetType: 1, targetId: 1 });

export const RatingModel = mongoose.models.Rating || model("Rating", ratingSchema);
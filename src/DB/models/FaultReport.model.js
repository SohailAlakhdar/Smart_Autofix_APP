import mongoose from "mongoose";
export let FaultTypeEnum = {
    text: "text",
    image: "image"
}
export let FaultReportStatusEnum = {
    resolved_by_user: "resolved_by_user",
    needs_technician: "needs_technician",
}
const nearestServiceCenterSchema = new mongoose.Schema(
    {
        refId: { type: Schema.Types.ObjectId, ref: 'ServiceCenter' },
        name: String,
        phone: String,
        distanceKm: Number,
    },
    { _id: false }
);

const nearestTowTruckSchema = new mongoose.Schema(
    {
        refId: { type: Schema.Types.ObjectId, ref: 'TowTruck' },
        name: String,
        phone: String,
        distanceKm: Number,
    },
    { _id: false }
);

const FaultReportSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        faultType: { type: String, enum: [FaultTypeEnum.text, FaultTypeEnum.image] },
        faultText: {
            type: String,
            default: null,
        },
        faultImage: { secure_url: String, public_id: String },       // النص أو رابط الصورة
        aiResult: {
            faultName: String,
            difficulty: { type: String, enum: [FaultReportStatusEnum.resolved_by_user, FaultReportStatusEnum.needs_technician, FaultReportStatusEnum.pending] },
            requiredTools: [String],
            steps: [String],
            safetyTips: [String],
            confidence: Number
        },
        status: { type: String, enum: [FaultReportStatusEnum.resolved_by_user, FaultReportStatusEnum.needs_technician, FaultReportStatusEnum.pending] },
        // Auto-attached only when difficulty === "hard"
        nearestServiceCenter: {
            type: nearestServiceCenterSchema,
            default: null,
        },
        nearestTowTruck: {
            type: nearestTowTruckSchema,
            default: null,
        },
        userFeedback: {
            wasHelpful: Boolean,
            rating: Number,
            comment: String
        },
        createdAt: Date
    },
    { timestamps: true }
);

faultReportSchema.index({ userId: 1, createdAt: -1 });
faultReportSchema.index({ location: '2dsphere' });

export const FaultReportModel =
    mongoose.models.FaultReport || mongoose.model("FaultReport", FaultReportSchema);
FaultReportModel.syncIndexes();
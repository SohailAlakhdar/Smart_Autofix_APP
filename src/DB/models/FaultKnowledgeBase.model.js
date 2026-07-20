import mongoose from "mongoose";

const serviceCenterSchema = new mongoose.Schema(
    {
        faultName: String,
        symptoms: [String],
        difficulty: String,
        tools: [String],
        steps: [String],
        successRate: Number,   // يتحدث بناءً على userFeedback
        reportCount: Number
    },
    { timestamps: true }
);

serviceCenterSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ServiceCenter', serviceCenterSchema);
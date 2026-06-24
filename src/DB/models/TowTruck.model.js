const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const technicianSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, unique: true, index: true },
        password: { type: String, required: true, minlength: 6, select: false },

        specialties: {
            type: [String],
            required: true,
            enum: [
                'automotive',
                'home_appliances',
                'electrical',
                'plumbing',
                'electronics',
                'hvac',
                'other',
            ],
        },

        bio: { type: String, maxlength: 500 },
        yearsOfExperience: { type: Number, default: 0 },

        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
        },
        serviceRadiusKm: { type: Number, default: 15 },

        isVerified: { type: Boolean, default: false }, // توثيق يدوي من الإدارة
        isAvailable: { type: Boolean, default: true },

        averageRating: { type: Number, default: 0, min: 0, max: 5 },
        ratingsCount: { type: Number, default: 0 },
        completedJobsCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

technicianSchema.index({ location: '2dsphere' });
technicianSchema.index({ specialties: 1, isAvailable: 1 });

technicianSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

technicianSchema.methods.comparePassword = function (candidate) {
    return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('Technician', technicianSchema);
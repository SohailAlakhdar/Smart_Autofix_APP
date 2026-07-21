import mongoose from "mongoose";

export const serviceCenterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    address: {
      type: String,
      trim: true,
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    specialties: { type: [String], default: [] }, // مثال: كهرباء سيارات، مكينة، إطارات
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    ratingsCount: {
      type: Number,
      default: 0,
    },
    ratingsBreakdown: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 },
    },
    workingHours: {
      type: String, // e.g. "9:00 AM - 10:00 PM"
      default: null,
    }, freezedAt: {
      type: Date,
    },
    freezedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

  },
  { timestamps: true }
);

serviceCenterSchema.index({ location: '2dsphere' });

// Matches find, findOne, findOneAndUpdate, findOneAndDelete, countDocuments, etc.
serviceCenterSchema.pre(/^find/, function (next) {

  if (!this.getOptions().includeFrozen) {
    this.where({ freezedAt: { $exists: false } });
  }
  next();
});

export const ServiceCenterModel =
  mongoose.models.ServiceCenter || mongoose.model("ServiceCenter", serviceCenterSchema);
ServiceCenterModel.syncIndexes();
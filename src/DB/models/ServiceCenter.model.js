import mongoose from "mongoose";

const serviceCenterSchema = new mongoose.Schema(
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
    workingHours: {
      type: String, // e.g. "9:00 AM - 10:00 PM"
      default: null,
    },
  },
  { timestamps: true }
);

serviceCenterSchema.index({ location: '2dsphere' });

export default mongoose.model("ServiceCenter", serviceCenterSchema);
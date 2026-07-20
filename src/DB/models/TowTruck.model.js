import mongoose from "mongoose";

const towTruckSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },

    rating: { type: Number, default: 0 }

  },
  { timestamps: true }
);

towTruckSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('TowTruck', towTruckSchema);
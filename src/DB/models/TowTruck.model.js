import mongoose from "mongoose";

const towTruckSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    freezedAt: {
      type: Date,
    },
    freezedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rating: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 },
    ratingsBreakdown: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 },
    },

  },
  { timestamps: true }
);

towTruckSchema.index({ location: '2dsphere' });

export const TowTruckModel =
  mongoose.models.TowTruck || mongoose.model("TowTruck", towTruckSchema);
TowTruckModel.syncIndexes();
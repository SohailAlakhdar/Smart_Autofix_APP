const mongoose = require('mongoose');

const serviceCenterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    address: { type: String },

    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },

    specialties: { type: [String], default: [] }, // مثال: كهرباء سيارات، مكينة، إطارات
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

serviceCenterSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ServiceCenter', serviceCenterSchema);
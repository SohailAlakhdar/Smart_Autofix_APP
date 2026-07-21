import Joi from "joi";

// NOTE: assumes the same shape as your existing user.validation.js —
// each export is an object keyed by request part ({ params, query, body })
// that your `validation` middleware checks and validates per key.
// If your generalRules/generalFields helper (objectId, etc.) lives
// elsewhere, swap the inline `objectId` below for that shared one.

const objectId = Joi.string().hex().length(24).messages({
    "string.hex": "invalid id format",
    "string.length": "invalid id format",
});

const locationBody = Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2).required(), // [lng, lat]
    address: Joi.string().trim().optional(),
    city: Joi.string().trim().optional(),
});

export const listServiceCenters = {
    query: Joi.object({
        city: Joi.string().trim().optional(),
        specialty: Joi.string().trim().optional(),
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
    }),
};

export const nearbyServiceCenters = {
    query: Joi.object({
        lat: Joi.number().min(-90).max(90).required(),
        lng: Joi.number().min(-180).max(180).required(),
        maxDistanceKm: Joi.number().positive().optional(),
        limit: Joi.number().integer().min(1).max(50).optional(),
        specialty: Joi.string().trim().optional(),
    }),
};

export const serviceCenterId = {
    params: Joi.object({
        id: objectId.required(),
    }),
};

export const createServiceCenter = {
    body: Joi.object({
        name: Joi.string().trim().min(2).max(100).required(),
        phone: Joi.string().trim().required(),
        address: Joi.string().trim().optional(),
        location: locationBody.required(),
        specialties: Joi.array().items(Joi.string().trim()).optional(),
        workingHours: Joi.string().trim().optional(),
    }),
};

export const updateServiceCenter = {
    params: Joi.object({
        id: objectId.required(),
    }),
    body: Joi.object({
        name: Joi.string().trim().min(2).max(100).optional(),
        phone: Joi.string().trim().optional(),
        location: locationBody.optional(),
        specialties: Joi.array().items(Joi.string().trim()).optional(),
        workingHours: Joi.string().trim().optional(),
    }).min(1),
};

//
export const rateServiceCenter = {
    params: Joi.object({
        id: objectId.required(),
    }),
    body: Joi.object({
        rating: Joi.number().integer().min(1).max(5).required(),
        comment: Joi.string().trim().max(500).allow("").optional(),
    }),
};
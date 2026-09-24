import Joi from "joi";

const objectId = Joi.string().hex().length(24).messages({
    "string.hex": "invalid id format",
    "string.length": "invalid id format",
});

const locationBody = Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2).required(), // [lng, lat]
});

export const listTowTrucks = {
    query: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        isAvailable: Joi.boolean().optional(),
    }),
};

export const nearbyTowTrucks = {
    query: Joi.object({
        lat: Joi.number().min(-90).max(90).required(),
        lng: Joi.number().min(-180).max(180).required(),
        maxDistanceKm: Joi.number().positive().optional(),
        limit: Joi.number().integer().min(1).max(50).optional(),
        onlyAvailable: Joi.boolean().optional(),
    }),
};

export const towTruckId = {
    params: Joi.object({
        id: objectId.required(),
    }),
};

export const createTowTruck = {
    body: Joi.object({
        name: Joi.string().trim().min(2).max(100).required(),
        phone: Joi.string().trim().required(),
        location: locationBody.required(),
    }),
};

export const updateTowTruck = {
    params: Joi.object({
        id: objectId.required(),
    }),
    body: Joi.object({
        name: Joi.string().trim().min(2).max(100).optional(),
        phone: Joi.string().trim().optional(),
        location: locationBody.optional(),
    }).min(1),
};

export const requestTowTruck = {
    params: Joi.object({
        id: objectId.required(),
    }),
    body: Joi.object({
        // Where the user currently is, so the driver knows where to go.
        location: locationBody.optional(),
    }),
};

export const updateAvailability = {
    params: Joi.object({
        id: objectId.required(),
    }),
    body: Joi.object({
        isAvailable: Joi.boolean().required(),
    }),
};

export const rateTowTruck = {
    params: Joi.object({
        id: objectId.required(),
    }),
    body: Joi.object({
        rating: Joi.number().integer().min(1).max(5).required(),
    }),
};
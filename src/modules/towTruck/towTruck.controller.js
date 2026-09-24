import { Router } from "express";
const router = Router();

import * as towTruckService from "./towTruck.service.js";
import { auth, authentication } from "../../middlewares/auth.middlewares.js";
import { tokenTypeEnum } from "../../utils/security/token.security.js";
import { roleEnum } from "../../DB/models/User.model.js";
import * as validators from "./towTruck.validation.js";
import { validation } from "../../middlewares/validation.middleware.js";

// List tow trucks (optionally filter by availability)
router.get(
    "/",
    validation(validators.listTowTrucks),
    towTruckService.listTowTrucks
);

// Nearest tow trucks by lat/lng — any authenticated role
router.get(
    "/nearby",
    auth({
        tokenType: tokenTypeEnum.access,
        accessRoles: Object.values(roleEnum),
    }),
    validation(validators.nearbyTowTrucks),
    towTruckService.nearbyTowTrucks
);

// Single tow truck details
router.get(
    "/:id",
    validation(validators.towTruckId),
    towTruckService.getTowTruck
);

// Create a new tow truck — admin only
router.post(
    "/",
    auth({
        tokenType: tokenTypeEnum.access,
        accessRoles: [roleEnum.admin],
    }),
    validation(validators.createTowTruck),
    towTruckService.createTowTruck
);

// Update a tow truck — admin only
router.put(
    "/:id",
    auth({
        tokenType: tokenTypeEnum.access,
        accessRoles: [roleEnum.admin],
    }),
    validation(validators.updateTowTruck),
    towTruckService.updateTowTruck
);

// Delete (freeze) a tow truck — admin only
router.delete(
    "/:id",
    auth({
        tokenType: tokenTypeEnum.access,
        accessRoles: [roleEnum.admin],
    }),
    validation(validators.towTruckId),
    towTruckService.deleteTowTruck
);

// Request a tow truck directly, no fault report attached — any authenticated role
router.post(
    "/:id/request",
    authentication(),
    validation(validators.requestTowTruck),
    towTruckService.requestTowTruck
);

// Update availability (متاح/مشغول) —  admin
router.put(
    "/:id/availability",
    auth({
        tokenType: tokenTypeEnum.access,
        accessRoles: [roleEnum.admin, roleEnum.technician],
    }),
    validation(validators.updateAvailability),
    towTruckService.updateAvailability
);

// Rate a tow truck — any authenticated role
router.post(
    "/:id/rate",
    authentication(),
    validation(validators.rateTowTruck),
    towTruckService.rateTowTruck
);

export default router;
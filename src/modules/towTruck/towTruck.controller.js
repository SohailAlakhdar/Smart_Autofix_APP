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

// Nearest tow trucks by lat/lng — Public, no login/fault/image required
router.get(
    "/nearby",
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

// Unfreeze a tow truck — admin only (was missing)
router.patch(
    "/:id/unfreeze",
    auth({
        tokenType: tokenTypeEnum.access,
        accessRoles: [roleEnum.admin],
    }),
    validation(validators.towTruckId),
    towTruckService.unfreezeTowTruck
);



// Rate a tow truck — any authenticated role
router.post(
    "/:id/rate",
    authentication(),
    validation(validators.rateTowTruck),
    towTruckService.rateTowTruck
);

export default router;
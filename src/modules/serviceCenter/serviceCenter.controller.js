import { Router } from "express";
const router = Router();

import * as serviceCenterService from "./serviceCenter.service.js";
import { auth, authentication } from "../../middlewares/auth.middlewares.js";
import { tokenTypeEnum } from "../../utils/security/token.security.js";
import { roleEnum } from "../../DB/models/User.model.js";
import * as validators from "./serviceCenter.validation.js";
import { validation } from "../../middlewares/validation.middleware.js";

// List service centers (filter by city / specialty)
router.get(
    "/",
    validation(validators.listServiceCenters),
    serviceCenterService.listServiceCenters
);

// Nearest service centers by lat/lng — Public, no login/fault/image required
router.get(
    "/nearby",
    validation(validators.nearbyServiceCenters),
    serviceCenterService.nearbyServiceCenters
);

// Single service center details
router.get(
    "/:id",
    validation(validators.serviceCenterId),
    serviceCenterService.getServiceCenter
);

// Create a new service center — admin only
router.post(
    "/",
    auth({
        tokenType: tokenTypeEnum.access,
        accessRoles: [roleEnum.admin],
    }),
    validation(validators.createServiceCenter),
    serviceCenterService.createServiceCenter
);

// Update a service center — admin only
router.put(
    "/:id",
    auth({
        tokenType: tokenTypeEnum.access,
        accessRoles: [roleEnum.admin],
    }),
    validation(validators.updateServiceCenter),
    serviceCenterService.updateServiceCenter
);

// Delete (freeze) a service center — admin only
router.delete(
    "/:id",
    auth({
        tokenType: tokenTypeEnum.access,
        accessRoles: [roleEnum.admin],
    }),
    validation(validators.serviceCenterId),
    serviceCenterService.deleteServiceCenter
);

// Unfreeze a service center — admin only (was missing)
router.patch(
    "/:id/unfreeze",
    auth({
        tokenType: tokenTypeEnum.access,
        accessRoles: [roleEnum.admin],
    }),
    validation(validators.serviceCenterId),
    serviceCenterService.unfreezeServiceCenter
);

// Rate a service center — any authenticated role
router.post(
    "/:id/rate",
    authentication(),
    validation(validators.rateServiceCenter),
    serviceCenterService.rateServiceCenter
);

export default router;
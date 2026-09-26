import { Router } from "express";
const router = Router();

import * as adminService from "./admin.service.js";
import { auth } from "../../middlewares/auth.middlewares.js";
import { tokenTypeEnum } from "../../utils/security/token.security.js";
import { roleEnum } from "../../DB/models/User.model.js";

// Dashboard stats — Admin only
router.get(
    "/dashboard",
    auth({
        tokenType: tokenTypeEnum.access,
        accessRoles: [roleEnum.admin],
    }),
    adminService.getDashboard
);

export default router;
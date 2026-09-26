import { Router } from "express";
const router = Router();
import * as userService from "./user.service.js";
import { auth, authentication } from "../../middlewares/auth.middlewares.js";
import { tokenTypeEnum } from "../../utils/security/token.security.js";
import { roleEnum } from "../../DB/models/User.model.js";
import * as validators from "./user.validation.js";
import { validation } from "../../middlewares/validation.middleware.js";
import { fileValidation } from "../../utils/multer/local.multer.js";
import { cloudeFieldUpload } from "../../utils/multer/cloud.multer.js";

// Get own profile
router.get(
    "/",
    auth({
        tokenType: tokenTypeEnum.access,
        accessRoles: Object.values(roleEnum),
    }),
    userService.getUserId
);

// List all users — ADMIN ONLY
router.get(
    "/users",
    auth({
        tokenType: tokenTypeEnum.access,
        accessRoles: [roleEnum.admin],
    }),
    userService.getUsers
);

// View a single user's details — ADMIN ONLY
router.get(
    "/users/:userId",
    auth({
        tokenType: tokenTypeEnum.access,
        accessRoles: [roleEnum.admin],
    }),
    validation(validators.userId),
    userService.getUserDetails
);

// Update basic profile
router.patch(
    "/update",
    authentication(),
    validation(validators.BasicUpdateSchema),
    userService.updateBasicProfile
);
// upload-file
router.patch(
    "/profile-image",
    authentication(),
    cloudeFieldUpload({
        validation: fileValidation.image,
    }).single("image"),
    userService.profileImage
);

// update password
router.patch(
    "/password",
    authentication(),
    validation(validators.updatePassword),
    userService.changePassword
);

// freeze account — ADMIN ONLY. Users cannot freeze their own account.
router.delete(
    "/freeze-account/:userId",
    auth({
        tokenType: tokenTypeEnum.access,
        accessRoles: [roleEnum.admin],
    }),
    validation(validators.freezeAccount),
    userService.freezeAccount
);

// unfreeze account — ADMIN ONLY
router.patch(
    "/unfreeze-account/:userId",
    auth({
        tokenType: tokenTypeEnum.access,
        accessRoles: [roleEnum.admin],
    }),
    validation(validators.freezeAccount),
    userService.restoreAccount
);

// delete account — ADMIN ONLY. Users cannot delete their own account.
router.delete(
    "/delete-account/:userId",
    auth({
        tokenType: tokenTypeEnum.access,
        accessRoles: [roleEnum.admin],
    }),
    validation(validators.deleteAccount),
    userService.deleteAccount
);

// logout
router.post("/logout", authentication(), userService.logout);


export default router;
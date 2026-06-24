import { Router } from "express";
const router = Router();
import * as userService from "./user.service.js";
import { auth, authentication } from "../../middlewares/auth.middlewares.js";
import { tokenTypeEnum } from "../../utils/security/token.security.js";
import { roleEnum } from "../../DB/models/User.model.js";
import * as validators from "./user.validation.js";
import { validation } from "../../middlewares/validation.middleware.js";
import { fileValidation } from "../../utils/multer/local.multer.js";
import { cloudeFieldUpload } from "../../utils/multer/cloude.multer.js";

// Get user ID
router.get(
    "/",
    auth({
        tokenType: tokenTypeEnum.access,
        accessRoles: Object.values(roleEnum),
    }),
    userService.getUserId
);

//  sharing a user's profile
router.get(
    "/:userId/share-profile",
    validation(validators.shareProfile),
    userService.shareProfile
);

// getting new login credentials
router.get(
    "/profile/refresh-token",
    auth({ tokenType: tokenTypeEnum.refresh }),
    userService.getNewLoginCredentials
);

// Update basic profile
router.patch(
    "/update",
    authentication(),
    validation(validators.BasicUpdateSchema),
    userService.updateBasicProfile
);
// update password
router.patch(
    "/password",
    authentication(),
    validation(validators.updatePassword),
    userService.updatePassword
);
// freeze account
router.delete(
    "/freeze-account/:userId",
    authentication(),
    validation(validators.freezeAccount),
    userService.freezeAccount
);
// delete account
router.delete(
    "/delete-account/:userId",
    authentication(),
    validation(validators.deleteAccount),
    userService.deleteAccount
);
// restore account
router.patch(
    "/restore-account/:userId",
    auth({ accessRoles: [roleEnum.admin] }),
    validation(validators.restoreAccount),
    userService.restoreAccount
);
// logout
router.post("/logout", authentication(), userService.logout);

// upload-file
router.patch(
    "/upload-file",
    authentication(),
    cloudeFieldUpload({
        validation: fileValidation.image,
    }).single("image"),
    userService.profileImage
);

export default router;

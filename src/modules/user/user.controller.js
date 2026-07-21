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

router.get(
    "/users",
    auth({
        tokenType: tokenTypeEnum.access,
        accessRoles: Object.values(roleEnum),
    }),
    userService.getUsers
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
// freeze account
router.delete(
    "/freeze-account/:userId",
    authentication(),
    validation(validators.freezeAccount),
    userService.freezeAccount
);
router.patch(
    "/restore-account/:userId",
    authentication(),
    validation(validators.restoreAccount),
    userService.restoreAccount
);
// delete account
router.delete(
    "/delete-account/:userId",
    authentication(),
    validation(validators.deleteAccount),
    userService.deleteAccount
);

// logout
router.post("/logout", authentication(), userService.logout);


export default router;

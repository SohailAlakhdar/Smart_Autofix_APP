import { Router } from "express";
const router = Router();

import { auth } from "../../middlewares/auth.middlewares.js";
import { tokenTypeEnum } from "../../utils/security/token.security.js";
import { deleteFault, diagnoseFault, getAllFaults, getCommonFaultStats, getFaultById, getFaultHistory, submitFeedback } from "./fault.service.js";
import { validation } from "../../middlewares/validation.middleware.js";
import { fileValidation } from "../../utils/multer/local.multer.js";
import { cloudeFieldUpload } from "../../utils/multer/cloude.multer.js";

// All fault routes require a logged-in, non-frozen user
router.use(auth(tokenTypeEnum.access, ["User"]));

// Admin-only routes (must be declared BEFORE "/:id" to avoid route collision)
router.get("/stats/common", auth(tokenTypeEnum.access, ["Admin"]), getCommonFaultStats);
router.get("/", auth(tokenTypeEnum.access, ["Admin"]), getAllFaults);

// User routes
router.post("/diagnose",
    cloudeFieldUpload({
        validation: fileValidation.image,
    }).single("image"), diagnoseFault);


router.get("/history", getFaultHistory);
router.get("/:id", getFaultById);
router.delete("/:id", deleteFault);
router.post("/:id/feedback", submitFeedback);

export default router;
import { Router } from "express";
const router = Router()
import * as authService from "./auth.service.js"
import * as validators from "./auth.validation.js"
import { validation } from "../../middlewares/validation.middleware.js";

router.post("/signup", validation(validators.signup), authService.signup)
router.post("/login", validation(validators.login), authService.login)

router.post("/signup/gmail", validation(validators.signupWithGmail), authService.signupWithGmail)
router.post("/login/gmail", validation(validators.loginWithGmail), authService.loginWithGmail)


router.patch("/confirm-email", validation(validators.confirmEmail), authService.confirmEmail)

router.patch("/forgot-password", validation(validators.forgotPassword), authService.forgotPassword)
router.patch("/reset-password", validation(validators.resetPassword), authService.resetPassword)
export default router
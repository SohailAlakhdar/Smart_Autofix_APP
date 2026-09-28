import { Router } from "express";
const router = Router();
import * as authService from "./auth.service.js";
import * as validators from "./auth.validation.js";
import { validation } from "../../middlewares/validation.middleware.js";

// Signup — creates the account, returns access + refresh tokens
router.post(
    "/signup",
    validation(validators.signup),
    authService.signup
);

// Login — email + password, returns access + refresh tokens
router.post(
    "/login",
    validation(validators.login),
    authService.login
);

// Refresh — exchange a valid refresh token for a new access token
router.post(
    "/refresh-token",
    validation(validators.refreshToken),
    authService.refreshToken
);

// Forgot password (step 1) — email only, emails a reset OTP if the account exists
router.post(
    "/forgot-password",
    validation(validators.forgotPassword),
    authService.forgotPassword
);

// Reset password (step 2) — email + OTP + password + confirmPassword
router.post(
    "/reset-password",
    validation(validators.resetPassword),
    authService.resetPassword
);

export default router;
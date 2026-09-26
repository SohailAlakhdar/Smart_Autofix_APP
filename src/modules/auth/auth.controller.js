import { Router } from "express";
const router = Router();
import * as authService from "./auth.service.js";
import * as validators from "./auth.validation.js";
import { validation } from "../../middlewares/validation.middleware.js";

// Signup — phone + password, creates and sends OTP
router.post(
    "/signup",
    validation(validators.signup),
    authService.signup
);

// Verify OTP — activates the user, returns access + refresh tokens
router.post(
    "/verify-otp",
    validation(validators.verifyOtp),
    authService.verifyOtp
);

// Login — phone + password, returns access + refresh tokens
router.post(
    "/login",
    validation(validators.login),
    authService.login
);

// Refresh — exchange a valid refresh token for a new access token
router.post(
    "/refresh",
    validation(validators.refreshToken),
    authService.refreshToken
);

// Forgot password — phone only, sends a reset OTP if the account exists
router.post(
    "/forgot-password",
    validation(validators.forgotPassword),
    authService.forgotPassword
);

// Reset password — phone + OTP + new password
router.post(
    "/reset-password",
    validation(validators.resetPassword),
    authService.resetPassword
);

export default router;
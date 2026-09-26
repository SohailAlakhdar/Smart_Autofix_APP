import User, { roleEnum } from "../../DB/models/User.model.js";
import { generateHash, compareHash } from "../../utils/security/hash.security.js";
import {
    generateToken,
    verifyToken,
    tokenTypeEnum,
} from "../../utils/security/token.security.js";
import { generateOtp } from "../../utils/security/otp.security.js";
// import { sendSms } from "../../utils/sms/sms.service.js";
import { globalErrorHandling as AppError, asyncHandler, successResponse } from "../../utils/response.js";

// How long a signup OTP / password-reset OTP stays valid
const OTP_EXPIRES_IN_MINUTES = 10;

const otpExpiryDate = () =>
    new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000);

/* ------------------------------------------------------------------ */
/* Signup                                                              */
/* ------------------------------------------------------------------ */
export const signup = asyncHandler(async (req, res, next) => {
    const { phone, password } = req.body;

    const existingUser = await User.findOne({ phone });
    if (existingUser?.confirmedAt) {
        return next(new AppError("Phone number already registered", 409));
    }

    const otp = generateOtp();
    const hashedOtp = generateHash({ plaintext: otp });
    const hashedPassword = generateHash({ plaintext: password });

    if (existingUser) {
        // Unconfirmed signup already exists — refresh it rather than duplicate
        await User.updateOne(
            { _id: existingUser._id },
            {
                password: hashedPassword,
                otp: hashedOtp,
                otpExpiresAt: otpExpiryDate(),
            }
        );
    } else {
        await User.create({
            phone,
            password: hashedPassword,
            role: roleEnum.user,
            otp: hashedOtp,
            otpExpiresAt: otpExpiryDate(),
        });
    }

    // await sendSms({
    //     phone,
    //     message: `Your Smart Autofix verification code is ${otp}`,
    // });

    return successResponse({ res, message: "OTP sent successfully" });
});

/* ------------------------------------------------------------------ */
/* Verify OTP                                                          */
/* ------------------------------------------------------------------ */
export const verifyOtp = asyncHandler(async (req, res, next) => {
    const { phone, otp } = req.body;

    const user = await User.findOne({ phone });
    if (!user || !user.otp) {
        return next(new AppError("Invalid phone number or OTP", 400));
    }
    if (user.otpExpiresAt < new Date()) {
        return next(new AppError("OTP has expired", 400));
    }
    if (!compareHash({ plaintext: otp, hashValue: user.otp })) {
        return next(new AppError("Invalid OTP", 400));
    }

    await User.updateOne(
        { _id: user._id },
        {
            confirmedAt: new Date(),
            $unset: { otp: "", otpExpiresAt: "" },
        }
    );

    const accessToken = generateToken({
        payload: { id: user._id },
        tokenType: tokenTypeEnum.access,
    });
    const refreshToken = generateToken({
        payload: { id: user._id },
        tokenType: tokenTypeEnum.refresh,
    });

    return successResponse({
        res,
        message: "Phone verified successfully",
        data: { accessToken, refreshToken },
    });
});

/* ------------------------------------------------------------------ */
/* Login                                                                */
/* ------------------------------------------------------------------ */
export const login = asyncHandler(async (req, res, next) => {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user || !user.confirmedAt) {
        return next(new AppError("Invalid phone number or password", 401));
    }
    if (user.freezedAt) {
        return next(new AppError("This account has been frozen", 403));
    }
    if (!compareHash({ plaintext: password, hashValue: user.password })) {
        return next(new AppError("Invalid phone number or password", 401));
    }

    const accessToken = generateToken({
        payload: { id: user._id },
        tokenType: tokenTypeEnum.access,
    });
    const refreshToken = generateToken({
        payload: { id: user._id },
        tokenType: tokenTypeEnum.refresh,
    });

    return successResponse({
        res,
        message: "Login successful",
        data: { accessToken, refreshToken },
    });
});

/* ------------------------------------------------------------------ */
/* Refresh Token                                                        */
/* ------------------------------------------------------------------ */
export const refreshToken = asyncHandler(async (req, res, next) => {
    const { refreshToken: token } = req.body;

    const decoded = verifyToken({ token, tokenType: tokenTypeEnum.refresh });
    if (!decoded?.id) {
        return next(new AppError("Invalid refresh token", 401));
    }

    const user = await User.findOne({ _id: decoded.id });
    if (!user || user.freezedAt) {
        return next(new AppError("Account not found or frozen", 401));
    }

    const accessToken = generateToken({
        payload: { id: user._id },
        tokenType: tokenTypeEnum.access,
    });

    return successResponse({ res, data: { accessToken } });
});

/* ------------------------------------------------------------------ */
/* Forgot Password — request a reset code                              */
/* ------------------------------------------------------------------ */
export const forgotPassword = asyncHandler(async (req, res, next) => {
    const { phone } = req.body;

    const user = await User.findOne({ phone });

    // Respond identically whether or not the phone is registered, so the
    // endpoint can't be used to enumerate valid accounts.
    if (user && user.confirmedAt && !user.freezedAt) {
        const otp = generateOtp();
        const hashedOtp = generateHash({ plaintext: otp });

        await User.updateOne(
            { _id: user._id },
            {
                passwordResetOtp: hashedOtp,
                passwordResetOtpExpiresAt: otpExpiryDate(),
            }
        );

        // await sendSms({
        //     phone,
        //     message: `Your Smart Autofix password reset code is ${otp}`,
        // });
    }

    return successResponse({
        res,
        message: "If this phone number is registered, a reset code has been sent",
    });
});

/* ------------------------------------------------------------------ */
/* Reset Password — consume the code, set a new password               */
/* ------------------------------------------------------------------ */
export const resetPassword = asyncHandler(async (req, res, next) => {
    const { phone, otp, newPassword } = req.body;

    const user = await User.findOne({ phone });
    if (!user || !user.passwordResetOtp) {
        return next(new AppError("Invalid phone number or reset code", 400));
    }
    if (user.passwordResetOtpExpiresAt < new Date()) {
        return next(new AppError("Reset code has expired", 400));
    }
    if (!compareHash({ plaintext: otp, hashValue: user.passwordResetOtp })) {
        return next(new AppError("Invalid reset code", 400));
    }

    const hashedPassword = generateHash({ plaintext: newPassword });

    await User.updateOne(
        { _id: user._id },
        {
            password: hashedPassword,
            $unset: { passwordResetOtp: "", passwordResetOtpExpiresAt: "" },
        }
    );

    return successResponse({ res, message: "Password reset successfully" });
});
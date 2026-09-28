import User, { roleEnum } from "../../DB/models/User.model.js";
import { generateHash, compareHash } from "../../utils/security/hash.security.js";
import {
    generateToken,
    verifyToken,
    tokenTypeEnum,
} from "../../utils/security/token.security.js";
import { generateOtp } from "../../utils/security/otp.security.js";

import { appError, asyncHandler, successResponse } from "../../utils/response.js";
import { sendEmail } from "../../utils/sendOtp.utils.js";

// How long a password-reset OTP stays valid
const OTP_EXPIRES_IN_MINUTES = 10;

const minutesFromNow = (minutes) => new Date(Date.now() + minutes * 60 * 1000);

const issueTokens = async (userId) => {
    const [accessToken, refreshToken] = await Promise.all([
        generateToken({
            payload: { id: userId },
            tokenType: tokenTypeEnum.access,
        }),
        generateToken({
            payload: { id: userId },
            tokenType: tokenTypeEnum.refresh,
        }),
    ]);

    return { accessToken, refreshToken };
};
/* ------------------------------------------------------------------ */
/* Signup                                                              */
/* ------------------------------------------------------------------ */
export const signup = asyncHandler(async (req, res) => {
    // role, confirmPassword and picture are never trusted from the body
    const { name, email, phone, password, location } = req.body;

    const existingUser = await User.findOne({ $or: [{ phone }, { email }] });
    if (existingUser) {
        throw appError("Phone number or email already registered", 409);
    }

    const user = await User.create({
        name,
        email,
        phone,
        password: generateHash({ plaintext: password }),
        role: roleEnum.user,
        location,
    });

    return successResponse({
        res,
        status: 201,
        message: "Account created successfully",
        data: await issueTokens(user._id),
    });
});

/* ------------------------------------------------------------------ */
/* Login                                                                */
/* ------------------------------------------------------------------ */
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // password is select:false in the schema, so request it explicitly
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        throw appError("Invalid email or password", 401);
    }
    if (user.freezedAt) {
        throw appError("This account has been frozen", 403);
    }
    if (!compareHash({ plaintext: password, hashValue: user.password })) {
        throw appError("Invalid email or password", 401);
    }

    return successResponse({
        res,
        message: "Login successful",
        data: await issueTokens(user._id),
    });
});

/* ------------------------------------------------------------------ */
/* Refresh Token                                                        */
/* ------------------------------------------------------------------ */
export const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken: token } = req.body;

    const decoded = verifyToken({ token, tokenType: tokenTypeEnum.refresh });
    if (!decoded?.id) {
        throw appError("Invalid refresh token", 401);
    }

    const user = await User.findOne({ _id: decoded.id });
    if (!user || user.freezedAt) {
        throw appError("Account not found or frozen", 401);
    }

    const accessToken = generateToken({
        payload: { id: user._id },
        tokenType: tokenTypeEnum.access,
    });

    return successResponse({ res, data: { accessToken } });
});

/* ------------------------------------------------------------------ */
/* Forgot Password (step 1) — email a reset code                       */
/* ------------------------------------------------------------------ */
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        throw appError("Email not Exits", 401);
    }

    if (user && !user.freezedAt) {
        const otp = generateOtp();

        await User.updateOne(
            { _id: user._id },
            {
                resetPasswordOtpHash: generateHash({ plaintext: otp }),
                resetPasswordOtpExpiresAt: minutesFromNow(OTP_EXPIRES_IN_MINUTES),
            }
        );

        await sendEmail({
            to: email,
            subject: "Smart Autofix password reset code",
            html: `<p>Your password reset code is <b>${otp}</b>. It expires in ${OTP_EXPIRES_IN_MINUTES} minutes.</p>`,
        });
    }

    return successResponse({
        res,
        message: "The code is sent Successfully",
    });
});

/* ------------------------------------------------------------------ */
/* Reset Password (step 2) — verify the code and set the new password  */
/* ------------------------------------------------------------------ */
export const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, password } = req.body;

    const user = await User.findOne({ email }).select("+resetPasswordOtpHash");
    if (!user || !user.resetPasswordOtpHash) {
        throw appError("Invalid email or reset code", 400);
    }
    if (user.resetPasswordOtpExpiresAt < new Date()) {
        throw appError("Reset code has expired", 400);
    }
    if (!compareHash({ plaintext: otp, hashValue: user.resetPasswordOtpHash })) {
        throw appError("Invalid reset code", 400);
    }

    // Set the new password and consume the code so it can't be reused
    await User.updateOne(
        { _id: user._id },
        {
            password: generateHash({ plaintext: password }),
            $unset: { resetPasswordOtpHash: "", resetPasswordOtpExpiresAt: "" },
        }
    );

    return successResponse({ res, message: "Password reset successfully" });
});
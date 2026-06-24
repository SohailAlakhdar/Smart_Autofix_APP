import { UserModel } from "../../DB/models/User.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
import {
    generateHash,
    compareHash,
} from "../../utils/security/hash.security.js";
import * as DBService from "../../DB/db.service.js";
import { encGenerate } from "../../utils/security/encryption.security.js";
import { OAuth2Client } from "google-auth-library";
import { generateLoginCredentials } from "../../utils/security/token.security.js";
import { emailEventEmitter } from "../../utils/events/email.event.js";
import { customAlphabet } from "nanoid";

// Function to verify Google token
async function verifyGoogleToken(tokenId) {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.GOOGLE_CLIENT_ID.split(","),
    });
    const payload = ticket.getPayload();
    return payload;
}

// signup -------------------
export const signup = asyncHandler(async (req, res, next) => {
    console.log(req.body);
    const { name, email, password, age, phone, role, gender } = req.body;
    const { lang } = req.query || "ar";
    if (
        await DBService.findOne({
            model: UserModel,
            filter: { email },
            select: "-password",
        })
    ) {
        return next(new Error("Email exist", { cause: 409 }));
    }
    // hash the password
    const hashPassword = generateHash({
        plaintext: password,
        saltRound: parseInt(process.env.SALT) || 12,
    });
    // encrypt the phone
    const encPhone = await encGenerate({
        plaintext: phone,
        secretKey: process.env.ENCRYPTION_SECRET,
    });
    // generate OTP for email confirmation
    const otp = customAlphabet("123456789", 6)();
    const confirmEmailOtp = generateHash({
        plaintext: otp,
        saltRound: parseInt(process.env.SALT) || 12,
    });
    emailEventEmitter.emit("ConfirmationEmail", {
        to: email,
        // to: "sohailalakhdar1@gmail.com",
        otp: otp,
        subject: "Verify your Saraha App account",
    });

    const [user] = await DBService.create({
        model: UserModel,
        data: [
            {
                name,
                email,
                password: hashPassword,
                age,
                phone: encPhone,
                role,
                gender,
                confirmEmailOtp,
                lang,
            },
        ],
        options: {},
    });
    return successResponse({
        res,
        status: 201,
        data: { user },
        message: "done",
    });
});

// confirm email -------------------
export const confirmEmail = asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;
    const user = await DBService.findOne({
        model: UserModel,
        filter: {
            email,
            confirmEmailOtp: { $exists: true },
            confirmEmail: { $exists: false },
        },
        select: "-password",
    });
    if (!user) {
        return next(new Error("In-valid account", { cause: 404 }));
    }

    if (
        !compareHash({
            plaintext: otp,
            hashValue: user.confirmEmailOtp,
        })
    ) {
        return next(new Error("Invalid OTP", { cause: 404 }));
    }
    const updatedUser = await DBService.updateOne({
        model: UserModel,
        filter: { email },
        update: {
            confirmEmail: new Date(),
            confirmEmailOtp: null,
            $inc: { __v: 1 },
        },
        options: {},
    });
    return updatedUser.modifiedCount
        ? successResponse({
            res,
            status: 200,
            data: { updatedUser },
            message: "done",
        })
        : next(new Error("Failed to confirm email", { cause: 500 }));
});

// login -----------------
export const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    const user = await DBService.findOne({
        model: UserModel,
        filter: { email },
    });
    if (!user) {
        return next(new Error("In-valid login data", { cause: 404 }));
    }
    const match = compareHash({
        plaintext: password,
        hashValue: user.password,
    });
    if (!match) {
        return next(new Error("In-valid login Data", { cause: 404 }));
    }

    const credentials = await generateLoginCredentials({ user });
    return successResponse({
        res,
        status: 200,
        data: { ...credentials },
        message: "Done",
    });
});

// forgot password -------------------
export const forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const otp = customAlphabet("123456789", 6)();
    const hashOtp = generateHash({
        plaintext: otp,
        saltRound: parseInt(process.env.SALT) || 12,
    });
    emailEventEmitter.emit("forgotPassword", {
        to: email,
        otp: otp,
    });
    const user = await DBService.findOneAndUpdate({
        model: UserModel,
        filter: {
            email,
            freezedAt: { $exists: false },
        },
        update: {
            $set: {
                forgotPasswordOtp: hashOtp,
            },
        },
    });
    return successResponse({
        res,
        status: 200,
        data: { user },
        message: "Done",
    });
});

// reset password -------------------
export const resetPassword = asyncHandler(async (req, res, next) => {
    const { email, otp, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        return next(new Error("Passwords do not match", { cause: 400 }));
    }
    const user = await DBService.findOne({
        model: UserModel,
        filter: {
            email,
            forgotPasswordOtp: { $exists: true },
        },
    });
    if (!user) {
        return next(new Error("In-valid account", { cause: 404 }));
    }
    if (
        !compareHash({
            plaintext: otp,
            hashValue: user.forgotPasswordOtp,
        })
    ) {
        return next(new Error("Invalid OTP", { cause: 404 }));
    }
    const hashPassword = generateHash({
        plaintext: password,
    });
    const updatedUser = await DBService.findOneAndUpdate({
        model: UserModel,
        filter: {
            email,
            forgotPasswordOtp: { $exists: true },
        },
        update: {
            $set: {
                password: hashPassword,
                changeLoginCredentials: Date.now(),
            },
            $inc: { __v: 1 },
            $unset: {
                forgotPasswordOtp: "",
            },
        },
    });
    return successResponse({
        res,
        status: 200,
        data: { updatedUser },
        message: "Done",
    });
});

// signup with gmail -------------------
export const signupWithGmail = asyncHandler(async (req, res, next) => {
    const { tokenId } = req.body;
    const payload = await verifyGoogleToken({ tokenId });
    const { email, name, picture } = payload;
    const user = await DBService.findOne({
        model: UserModel,
        filter: { email },
        select: "-password",
    });
    if (user) {
        return next(new Error("Email exist", { cause: 409 }));
    }
    const [newUser] = await DBService.create({
        model: UserModel,
        data: [
            {
                email,
                name,
                picture,
            },
        ],
        options: {},
    });
    const credentials = await generateLoginCredentials({ user: newUser });
    return successResponse({
        res,
        status: 201,
        data: { ...credentials },
        message: "done",
    });
});

// login with gmail -----------------
export const loginWithGmail = asyncHandler(async (req, res, next) => {
    const { email, verifyEmail } = req.body;
    const user = await DBService.findOne({
        model: UserModel,
        filter: { email },
    });
    if (!user) {
        return next(new Error("In-valid login data", { cause: 404 }));
    }
    const credentials = await generateLoginCredentials({ user });
    if (!user.verifyEmail && !verifyEmail) {
        return next(new Error("Please verify your email", { cause: 403 }));
    }
    return successResponse({
        res,
        status: 200,
        data: { ...credentials },
        message: "done",
    });
});

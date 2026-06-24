import { roleEnum } from "../../DB/models/User.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
import { decGenerate } from "../../utils/security/encryption.security.js";
import * as DBService from "../../DB/db.service.js";
import { generateLoginCredentials } from "../../utils/security/token.security.js";
import { UserModel } from "../../DB/models/User.model.js";
import { encGenerate } from "../../utils/security/encryption.security.js";
import { compareHash } from "../../utils/security/hash.security.js";
import { generateHash } from "../../utils/security/hash.security.js";
import {
    destroyFile,
    deleteResources,
    deleteFolderByPrefix,
} from "../../utils/multer/cloudinary.js";
import { uploadFile } from "../../utils/multer/cloudinary.js";
import { uploadFiles } from "../../utils/multer/cloudinary.js";

export const getUserId = asyncHandler(async (req, res, next) => {
    const user = await DBService.findById({
        model: UserModel,
        id: req.user._id
    });
    req.user.phone = await decGenerate({
        ciphertext: req.user.phone,
        secretKey: process.env.ENCRYPTION_SECRET,
    });
    return successResponse({ res, data: { user } }); // ✅
});

export const shareProfile = asyncHandler(async (req, res, next) => {
    // console.log("Share Profile Request:", req.params, req.query);

    const { userId } = req.params;
    const user = await DBService.findOne({
        model: UserModel,
        filter: { _id: userId },
        select: "-password",
    });
    return user
        ? successResponse({ res, data: user })
        : next(new Error("User not found", { cause: 404 }));
});

export const getNewLoginCredentials = asyncHandler(async (req, res, next) => {
    const user = req.user;
    const credentials = generateLoginCredentials({
        user,
        signatures,
    });
    req.user.phone = await decGenerate({
        ciphertext: req.user.phone,
        secretKey: process.env.ENCRYPTION_SECRET,
    });
    return successResponse({
        res,
        data: credentials,
    });
});

export const updateBasicProfile = asyncHandler(async (req, res, next) => {
    // console.log("Find One And Update Request:", req.params, req.body);

    if (req.body.phone) {
        req.body.phone = await encGenerate({
            plaintext: req.body.phone,
            secretKey: process.env.ENCRYPTION_SECRET,
        });
    }
    const user = await DBService.findOneAndUpdate({
        model: UserModel,
        filter: { _id: req.user._id },
        update: req.body,
        update: {
            $set: {
                ...req.body,
            },
            $inc: { __v: 1 },
        },
    });
    return successResponse({ res, data: user }); // ✅
});

export const updatePassword = asyncHandler(async (req, res, next) => {
    // console.log("Update Password Request:", req.params, req.body);
    const { password, oldPassword, confirmPassword } = req.body;
    if (
        !compareHash({
            plaintext: oldPassword,
            hashValue: req.user.password,
        })
    ) {
        return next(new Error("Old password is incorrect", { cause: 400 }));
    }
    if (password !== confirmPassword) {
        return next(new Error("Passwords do not match", { cause: 400 }));
    }

    const user = await DBService.findOneAndUpdate({
        model: UserModel,
        filter: { _id: req.user._id },
        update: {
            $set: {
                password: generateHash({ plaintext: password }),
                changeLoginCredentials: Date.now(),
            },
            $inc: { __v: 1 },
        },
    });

    return successResponse({ res, data: user }); // ✅
});

export const freezeAccount = asyncHandler(async (req, res, next) => {
    // console.log("Freeze Account Request:", req.params, req.body);
    const userId = req.params.userId || req.user._id;
    if (
        req.user._id.toString() !== userId.toString() &&
        req.user.role !== roleEnum.admin
    ) {
        return next(
            new Error("You are not authorized to freeze this account", {
                cause: 403,
            })
        );
    }

    const user = await DBService.findOneAndUpdate({
        model: UserModel,
        filter: { _id: userId || req.user._id, deletedAt: { $exists: false } },
        update: {
            $set: {
                freezedAt: new Date(),
                freezedBy: req.user._id,
                restoredAt: null,
                restoredBy: null,
            },
            $inc: { __v: 1 },
        },
    });
    return successResponse({ res, data: user }); // ✅
});

export const deleteAccount = asyncHandler(async (req, res, next) => {
    // console.log("Delete Account Request:", req.params, req.body);
    const userId = req.params.userId;
    if (req.user.role !== roleEnum.admin) {
        return next(
            new Error("You are not authorized to delete this account", {
                cause: 403,
            })
        );
    }
    const user = await DBService.deleteOne({
        model: UserModel,
        filter: { _id: userId, freezedAt: { $exists: true } },
    });
    if (user.deletedCount) {
        await deleteFolderByPrefix({ prefix: `User/${userId}` });
    }
    return user.deletedCount
        ? successResponse({ res, data: user })
        : next(new Error("User not found", { cause: 404 }));
});

export const restoreAccount = asyncHandler(async (req, res, next) => {
    // console.log("Restore Account Request:", req.params, req.body);
    const { userId } = req.params;
    if (req.user.role !== roleEnum.admin) {
        return next(
            new Error("You are not authorized to restore this account", {
                cause: 403,
            })
        );
    }
    const user = await DBService.findOneAndUpdate({
        model: UserModel,
        filter: { _id: userId, freezedAt: { $exists: true } },
        update: {
            $unset: {
                freezedAt: 1,
                freezedBy: 1,
                restoredAt: new Date(),
                restoredBy: req.user._id,
            },
            $inc: { __v: 1 },
        },
    });
    return successResponse({ res, data: user }); // ✅
});

export const logout = asyncHandler(async (req, res, next) => {
    return successResponse({ res, data: {} }); // ✅
});

export const profileImage = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(
            new Error("No file uploaded or file format is invalid", {
                cause: 400,
            })
        );
    }
    const { secure_url, public_id } = await uploadFile({
        path: `User/${req.user?._id}`,
        file: req.file,
    });
    const user = await DBService.findOneAndUpdate({
        model: UserModel,
        filter: {
            _id: req.user._id,
        },
        update: {
            picture: { secure_url, public_id },
        },
        options: {
            new: false,
        },
    });
    if (user?.picture?.public_id) {
        await destroyFile({ public_id: user.picture.public_id });
    }
    // console.log(user);
    return successResponse({ res, data: { user } }); // ✅
});
// ------------------------
export const profileCoverImage = asyncHandler(async (req, res, next) => {
    // console.log("X:::", req);

    // console.log({ service: req.files });
    const attachments = await uploadFiles({
        files: req.files,
        path: `user/${req.user._id}/cover`,
    });
    if (!req.files) {
        return next(
            new Error("No file uploaded or file format is invalid", {
                cause: 400,
            })
        );
    }
    const user = await DBService.findOneAndUpdate({
        model: UserModel,
        filter: {
            _id: req.user._id,
        },
        update: {
            coverPicture: attachments,
        },
        options: {
            new: false,
        },
    });
    // console.log(user.coverPicture);
    if (user?.coverPicture?.length) {
        await deleteResources({
            public_id: user.coverPicture.map((ele) => ele.public_id),
        });
    }
    return successResponse({ res, data: { files: req.files } }); // ✅
});

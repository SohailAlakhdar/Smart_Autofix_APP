// jwt.sign(payload, secretOrPrivateKey, [options, callback])
import jwt from "jsonwebtoken";
import * as DBService from "../../DB/db.service.js";
import { UserModel } from "../../DB/models/User.model.js";
import { roleEnum } from "../../DB/models/User.model.js";
import { nanoid } from "nanoid";
// import { RevokeTokenModel } from "../../DB/models/RevokeToken.model.js";

export const signatureLevelEnum = { system: "system", bearer: "bearer" };
export const tokenTypeEnum = { access: "access", refresh: "refresh" };

export const generateToken = async ({
    payload = {},
    signature = process.env.ACCESS_TOKEN_USER_SIGNATURE,
    options = { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN },
} = {}) => {
    return jwt.sign(payload, signature, options);
};

export const verifyToken = async ({
    token = {},
    signature = process.env.ACCESS_TOKEN_USER_SIGNATURE,
} = {}) => {
    return jwt.verify(token, signature);
};

export const getSignatures = ({
    signatureLevel = signatureLevelEnum.bearer,
} = {}) => {
    if (signatureLevel === signatureLevelEnum.system) {
        return {
            accessSignature:
                process.env.ACCESS_TOKEN_SYSTEM_SIGNATURE ||
                process.env.ACCESS_TOKEN_ADMIN_SIGNATURE ||
                process.env.ACCESS_TOKEN_USER_SIGNATURE,
            refreshSignature:
                process.env.REFRESH_TOKEN_SYSTEM_SIGNATURE ||
                process.env.REFRESH_TOKEN_ADMIN_SIGNATURE ||
                process.env.REFRESH_TOKEN_USER_SIGNATURE,
        };
    }
    // default to user‑level tokens
    return {
        accessSignature: process.env.ACCESS_TOKEN_USER_SIGNATURE,
        refreshSignature: process.env.REFRESH_TOKEN_USER_SIGNATURE,
    };
};

export const decodedToken = async ({
    authorization = "",
    next,
    tokenType = tokenTypeEnum.access,
} = {}) => {
    if (!authorization) {
        next(new Error("Authorization header is required", { cause: 401 }));
        return { user: null, decoded: null };
    }
    const [scheme, token] = authorization?.split(" ") || [];
    if (!scheme || !token) {
        next(new Error("missing token parts", { cause: 401 }));
        return { user: null, decoded: null };
    }
    const normalizedScheme =
        scheme.toLowerCase() === "system"
            ? signatureLevelEnum.system
            : signatureLevelEnum.bearer;

    let signatures = getSignatures({ signatureLevel: normalizedScheme });
    const targetSignature =
        tokenType === tokenTypeEnum.access
            ? signatures.accessSignature
            : signatures.refreshSignature;

    let decoded;
    try {
        decoded = await verifyToken({
            token,
            signature: targetSignature,
        });
    } catch (err) {
        // Fallback: try alternate signature (user vs admin/system)
        try {
            const fallbackSignatures = getSignatures({
                signatureLevel:
                    normalizedScheme === signatureLevelEnum.system
                        ? signatureLevelEnum.bearer
                        : signatureLevelEnum.system,
            });
            const fallbackSig =
                tokenType === tokenTypeEnum.access
                    ? fallbackSignatures.accessSignature
                    : fallbackSignatures.refreshSignature;
            decoded = await verifyToken({ token, signature: fallbackSig });
        } catch {
            next(new Error("Invalid or expired token", { cause: 401 }));
            return { user: null, decoded: null };
        }
    }

    const user = await DBService.findById({
        model: UserModel,
        id: decoded.id,
    });

    if (!user) {
        next(new Error("Not register account", { cause: 404 }));
        return { user: null, decoded: null };
    }
    if (
        user.changeLoginCredentials &&
        decoded.iat <
            Math.floor(new Date(user.changeLoginCredentials).getTime() / 1000)
    ) {
        next(new Error("Old signature token", { cause: 401 }));
        return { user: null, decoded: null };
    }
    if (scheme.toLowerCase() === "system" && user.role !== roleEnum.admin) {
        next(new Error("Only admins can use System token", { cause: 403 }));
        return { user: null, decoded: null };
    }
    return { user, decoded };
};

export const generateLoginCredentials = async ({ user = {} }) => {
    const signatures = getSignatures({
        signatureLevel:
            user.role == roleEnum.user
                ? signatureLevelEnum.bearer
                : signatureLevelEnum.system,
    });
    const tokenId = nanoid();
    const access_token = await generateToken({
        payload: { id: user._id },
        signature: signatures.accessSignature,
        options: {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
            jwtid: tokenId,
        },
    });
    const refresh_token = await generateToken({
        payload: { id: user._id },
        signature: signatures.refreshSignature,
        options: {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
            jwtid: tokenId,
        },
    });
    return { access_token, refresh_token };
};

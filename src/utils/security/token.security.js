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
            accessSignature: process.env.ACCESS_TOKEN_SYSTEM_SIGNATURE,
            refreshSignature: process.env.REFRESH_TOKEN_SYSTEM_SIGNATURE,
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
        return next(
            new Error("Authorization header is required", { cause: 401 })
        );
    }
    const [scheme, token] = authorization?.split(" ") || [];
    if (!scheme || !token) {
        return next(new Error("missing token parts", { cause: 401 }));
    }
    const normalizedScheme =
        scheme.toLowerCase() === "system"
            ? signatureLevelEnum.system
            : signatureLevelEnum.bearer;

    let signatures = getSignatures({ signatureLevel: normalizedScheme });
    const decoded = await verifyToken({
        token,
        signature:
            tokenType === tokenTypeEnum.access
                ? signatures.accessSignature
                : signatures.refreshSignature,
    });
    // if (
    //     await DBService.findOne({
    //         model: RevokeTokenModel,
    //         filter: { idToken: decoded.jti },
    //     })
    // ) {
    //     return next(new Error("User have sign out from this device!", { cause: 401 }));
    // }
    const user = await DBService.findById({
        model: UserModel,
        id: decoded.id,
    });

    if (!user) {
        return next(new Error("Not register account", { cause: 404 }));
    }
    if (
        user.changeLoginCredentials &&
        decoded.iat <
            // Math.floor(new Date("2025-08-03T04:08:27.920Z").getTime() / 1000)
            Math.floor(new Date(user.changeLoginCredentials).getTime() / 1000)
    ) {
        return next(new Error("Old signature token", { cause: 401 }));
    }
    if (scheme.toLowerCase() === "bearer" && user.role === roleEnum.admin) {
        return next(new Error("Admins must use System token", { cause: 403 }));
    }
    if (scheme.toLowerCase() === "system" && user.role !== roleEnum.admin) {
        return next(
            new Error("Only admins can use System token", { cause: 403 })
        );
    }
    // console.log("Decoded without verify:", jwt.decode(token));
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

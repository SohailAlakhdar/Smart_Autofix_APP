import { asyncHandler } from "../utils/response.js";
import { decodedToken } from "../utils/security/token.security.js";
import { tokenTypeEnum } from "../utils/security/token.security.js";

export const authentication = ({ tokenType = tokenTypeEnum.access } = {}) => {
    return asyncHandler(async (req, res, next) => {
        const result = await decodedToken({
            authorization: req.headers.authorization,
            next,
            tokenType,
        });
        if (!result?.user) return;
        req.user = result.user;
        req.decoded = result.decoded;
        next();
    });
};

export const authorization = ({ accessRoles = [] } = {}) => {
    return asyncHandler(async (req, res, next) => {
        if (!accessRoles.includes(req.user.role)) {
            return next(
                new Error("You are not authorized to access this resource", {
                    cause: 403,
                })
            );
        }
        return next();
    });
};

export const auth = ({
    tokenType = tokenTypeEnum.access,
    accessRoles = [],
} = {}) =>
    asyncHandler(async (req, res, next) => {
        const result = await decodedToken({
            authorization: req.headers.authorization,
            next,
            tokenType,
        });

        if (!result?.user) return;
        if (!accessRoles.includes(result.user.role)) {
            return next(
                new Error("You are not authorized to access this resource", {
                    cause: 403,
                })
            );
        }
        req.user = result.user;
        req.decoded = result.decoded;
        return next();
    });

import { asyncHandler } from "../utils/response.js";
import { decodedToken } from "../utils/security/token.security.js";
import { tokenTypeEnum } from "../utils/security/token.security.js";

export const authentication = ({ tokenType = tokenTypeEnum.access } = {}) => {
    return asyncHandler(async (req, res, next) => {
        const { user, decoded } = await decodedToken({
            authorization: req.headers.authorization,
            next,
            tokenType,
        });
        if (!user) return;
        req.user = user;
        req.decoded = decoded;
        // console.log("FIELDS CONFIG OK");
        // console.log("Keys from Postman:", req.body ? Object.keys(req.body) : null );
        next();
    });
};

export const authorization = ({ accessRoles = [] } = {}) => {
    return asyncHandler(async (req, res, next) => {
        // console.log(accessRoles, req.user.role);
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
        const { user, decoded } = await decodedToken({
            authorization: req.headers.authorization,
            next,
            tokenType,
        });

        if (!user) return;
        if (!accessRoles.includes(user.role)) {
            return next(
                new Error("You are not authorized to access this resource", {
                    cause: 403,
                })
            );
        }
        req.user = user;
        req.decoded = decoded;
        return next();
    });

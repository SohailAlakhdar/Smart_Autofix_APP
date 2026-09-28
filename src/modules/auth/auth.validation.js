import joi from "joi";
import { generalFields } from "../../middlewares/validation.middleware.js";

const langQuery = joi.object().keys({ lang: generalFields.lang.optional() });

// [longitude, latitude] — GeoJSON order
const location = joi
    .array()
    .ordered(
        joi.number().min(-180).max(180).required(),
        joi.number().min(-90).max(90).required()
    )
    .required();

/* Signup — creates the account and returns tokens */
export const signup = {
    body: joi
        .object()
        .keys({
            name: generalFields.name.required(),
            email: generalFields.email.required(),
            phone: generalFields.phone.required(),
            password: generalFields.password.required(),
            confirmPassword: generalFields.confirmPassword.required(),
            location,
            picture: generalFields.picture,
        })
        .required(),
    query: langQuery,
};

/* Login — email + password */
export const login = {
    body: joi
        .object()
        .keys({
            email: generalFields.email.required(),
            password: generalFields.password.required(),
        })
        .required(),
    query: langQuery,
};

/* Refresh — exchange a refresh token for a new access token */
export const refreshToken = {
    body: joi
        .object()
        .keys({
            refreshToken: joi.string().trim().required(),
        })
        .required(),
    query: langQuery,
};

/* Forgot password (step 1) — email only */
export const forgotPassword = {
    body: joi
        .object()
        .keys({
            email: generalFields.email.required(),
        })
        .required(),
    query: langQuery,
};

/* Reset password (step 2) — email + code + new password */
export const resetPassword = {
    body: joi
        .object()
        .keys({
            email: generalFields.email.required(),
            otp: joi.string().trim().required(),
            password: generalFields.password.required(),
            confirmPassword: generalFields.confirmPassword.required(),
        })
        .required(),
    query: langQuery,
};
import joi from "joi";
import { generalFields } from "../../middlewares/validation.middleware.js";




// Validation schemas for auth module
export const signup = {
    body: joi
        .object()
        .keys({
            name: generalFields.name.required(),
            email: generalFields.email.required(),
            password: generalFields.password.required(),
            phone: generalFields.phone.required(),
            role: generalFields.role.optional(),
            age: generalFields.age.optional(),
            gender: generalFields.gender.optional(),
            picture:generalFields.picture,
        })
        .required(),
    query: joi.object().keys({ lang: generalFields.lang.optional() }),
};

// -------
export const login = {
    body: joi.object().keys({
        email: generalFields.email.required(),
        password: generalFields.password.required(),
    }),
    query: joi.object().keys({ lang: generalFields.lang.optional() }),
};

// -------
export const confirmEmail = {
    body: joi.object().keys({
        email: generalFields.email.required(),
        otp: generalFields.otp.required(),
    }),
    query: joi.object().keys({ lang: generalFields.lang.optional() }),
};
// -------
export const forgotPassword = {
    body: joi.object().keys({
        email: generalFields.email.required(),
    }),
};
// -------
export const resetPassword = {
    body: joi.object().keys({
        email: generalFields.email.required(),
        otp: generalFields.otp.required(),
        password: generalFields.password.required(),
        confirmPassword: generalFields.password.required(),
    }),

};
// ------
export const signupWithGmail = {
    body: joi.object().keys({
        tokenid: generalFields.tokenid.required(),
    }),
    query: joi.object().keys({ lang: generalFields.lang.optional() }),
};
// ------
export const loginWithGmail = {
    body: joi.object().keys({
        email: generalFields.email.required(),
        verifyEmail: generalFields.verifyEmail.required(),
    }),
    query: joi.object().keys({ lang: generalFields.lang.optional() }),
};

// -------
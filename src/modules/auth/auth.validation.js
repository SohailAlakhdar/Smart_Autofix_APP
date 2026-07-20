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
            picture: generalFields.picture,
            location: generalFields.location.required(),
            confirmPassword: generalFields.confirmPassword.required(),
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

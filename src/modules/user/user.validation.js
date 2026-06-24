import { generalFields } from "../../middlewares/validation.middleware.js";
import joi from "joi";
import { fileValidation } from "../../utils/multer/local.multer.js";
// Validation schemas for user module
export const shareProfile = {
    params: joi.object().keys({
        userId: generalFields.id.required(),
    }),
    query: joi.object().keys({ lang: generalFields.lang.optional() }),
};

export const BasicUpdateSchema = {
    body: joi
        .object()
        .keys({
            name: generalFields.name.optional(),
            phone: generalFields.phone.optional(),
            age: generalFields.age.optional(),
            gender: generalFields.gender.optional(),
            lang: generalFields.lang.optional(),
        })
        .required()
        .messages({
            "object.base": "Invalid update data",
        }),
    query: joi.object().keys({ lang: generalFields.lang.optional() }),
    params: joi.object().keys({}),
};

export const updatePassword = {
    body: joi
        .object()
        .keys({
            oldPassword: generalFields.password.required(),
            password: generalFields.password.required(),
            confirmPassword: generalFields.password.required(),
        })
        .required()
        .messages({
            "object.base": "Invalid update data",
        }),
};

export const freezeAccount = {
    params: joi.object().keys({
        userId: generalFields.id,
    }),
};
export const deleteAccount = {
    params: joi.object().keys({
        userId: generalFields.id,
    }),
};

export const restoreAccount = {
    params: joi.object().keys({
        userId: generalFields.id.required(),
    }),
};
export const profileImage = {
    file: joi
        .object()
        .keys({
            fieldname: generalFields.fileSchema.fieldname
                .valid("image")
                .required(),
            originalname: generalFields.fileSchema.originalname.required(),
            encoding: generalFields.fileSchema.encoding.required(),
            mimetype: generalFields.fileSchema.fieldname
                .valid(...fileValidation.image)
                .required(),
            // finalPath: generalFields.fileSchema.finalPath.required(),
            destination: generalFields.fileSchema.destination.required(),
            filename: generalFields.fileSchema.filename.required(),
            path: generalFields.fileSchema.path.required(),
            size: generalFields.fileSchema.size.required(),
        })
        .required(),
};

// export const profileCoverImage = {
//     files: joi.object().keys({
//         images: joi.array().items(
//             joi.object().keys({
//                 fieldname: generalFields.fileSchema.fieldname.required(),
//                 originalname: generalFields.fileSchema.originalname.required(),
//                 encoding: generalFields.fileSchema.encoding.required(),
//                 mimetype: generalFields.fileSchema.fieldname
//                     .valid(...fileValidation.image)
//                     .required(),
//                 // finalPath: generalFields.fileSchema.finalPath.required(),
//                 destination: generalFields.fileSchema.destination.required(),
//                 filename: generalFields.fileSchema.filename.required(),
//                 path: generalFields.fileSchema.path.required(),
//                 size: generalFields.fileSchema.size.required(),
//             })
//         ),
//         picture: joi.string().optional(),
//         documents: joi.array().items(
//             joi.object().keys({
//                 fieldname: generalFields.fileSchema.fieldname.required(),
//                 originalname: generalFields.fileSchema.originalname.required(),
//                 encoding: generalFields.fileSchema.encoding.required(),
//                 mimetype: generalFields.fileSchema.fieldname
//                     .valid(...fileValidation.image)
//                     .required(),
//                 // finalPath: generalFields.fileSchema.finalPath.required(),
//                 destination: generalFields.fileSchema.destination.required(),
//                 filename: generalFields.fileSchema.filename.required(),
//                 path: generalFields.fileSchema.path.required(),
//                 size: generalFields.fileSchema.size.required(),
//             })
//         ),
//     }),
// };
export const profileCoverImage = {
    files: joi.array().items(
        joi.object().keys({
            fieldname: generalFields.fileSchema.fieldname.required(),
            originalname: generalFields.fileSchema.originalname.required(),
            encoding: generalFields.fileSchema.encoding.required(),
            mimetype: generalFields.fileSchema.mimetype.required(),
            // finalPath: generalFields.fileSchema.finalPath.required(),
            destination: generalFields.fileSchema.destination.required(),
            filename: generalFields.fileSchema.filename.required(),
            path: generalFields.fileSchema.path.required(),
            size: generalFields.fileSchema.size.required(),
        })
    ),
};

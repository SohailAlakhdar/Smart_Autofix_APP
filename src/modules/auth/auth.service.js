import { UserModel } from "../../DB/models/User.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
import {
    generateHash,
    compareHash,
} from "../../utils/security/hash.security.js";
import * as DBService from "../../DB/db.service.js";
import { encGenerate } from "../../utils/security/encryption.security.js";
import { generateLoginCredentials } from "../../utils/security/token.security.js";
import { emailEventEmitter } from "../../utils/events/email.event.js";
import { customAlphabet } from "nanoid";


// signup -------------------
export const signup = asyncHandler(async (req, res, next) => {
    console.log(req.body);
    const { name, email, password, phone, location, role } = req.body;
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
    const [user] = await DBService.create({
        model: UserModel,
        data: [
            {
                name,
                email,
                password: hashPassword,
                phone: encPhone,
                role,
                lang,
                location,
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


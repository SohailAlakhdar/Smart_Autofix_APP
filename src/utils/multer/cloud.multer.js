import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const fileValidation = {
    image: ["image/jpeg", "image/png", "image/jpg", "image/gif"],
    document: ["application/pdf", "application/msword"],
};

export const cloudeFieldUpload = ({ validation = [] } = {}) => {
    const storage = multer.diskStorage({});

    const fileFilter = (req, file, cb) => {
        // console.log("Uploaded mimetype:", file.mimetype);
        if (validation.length && !validation.includes(file.mimetype)) {
            return cb(new Error("In-valid file format"), false);
        }
        cb(null, true);
    };
    return multer({ storage, fileFilter });
};

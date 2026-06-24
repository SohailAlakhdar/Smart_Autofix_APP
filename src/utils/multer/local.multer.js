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

export const localFieldUpload = ({
    customePath = "general",
    validation = [],
} = {}) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            // console.log("SS");
            const userSegment = req.user?._id ? `/${req.user._id}` : "";
            const uploadPath = path.resolve(
                __dirname,
                `../uploads/${customePath}${userSegment}`
            );
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
                // If the folder doesn’t exist, it creates it — including any missing parent directories.
            }
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const uniqueName =
                Date.now() +
                "__" +
                Math.round(Math.random() * 1e9) +
                "__" +
                file.originalname;
            file.finalPath = `${customePath}/${
                req.user?._id || "Nothing"
            }/${uniqueName}`;
            cb(null, uniqueName);
            // console.log(file.finalPath);
        },
    });

    const fileFilter = (req, file, cb) => {
        if (validation.length && !validation.includes(file.mimetype)) {
            return cb(new Error("In-valid file format"), false);
        }
        cb(null, true);
    };

    return multer({ storage, fileFilter });
};

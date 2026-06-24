import { v2 as cloudinary } from "cloudinary";

export const cloude = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET,
        secure: true, // https
    });
    return cloudinary;
};

export const uploadFile = async ({ file = {}, path = "general" } = {}) => {
    return cloude().uploader.upload(file.path, {
        folder: `${process.env.APPLICATION_NAME}/${path}`,
    });
};

export const uploadFiles = async ({ files = [{}], path = "general" } = {}) => {
    const attachments = [];
    for (const file of files) {
        const { secure_url, public_id } = await uploadFile({ file, path });
        attachments.push({ secure_url, public_id });
    }
    return attachments;
};

export const destroyFile = async ({ public_id = "" } = {}) => {
    return await cloude().uploader.destroy(public_id);
};

export const deleteResources = async ({
    public_id = [],
    options = { type: "upload", resource_type: "image" },
} = {}) => {
    return await cloude().api.delete_resources(public_id, options);
};
export const deleteFolderByPrefix = async ({ prefix = "" } = {}) => {
    return await cloude().api.delete_all_resources(
        `${process.env.APPLICATION_NAME}/${prefix}`
    );
};

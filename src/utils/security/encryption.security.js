import CryptoJS from "crypto-js";

export const encGenerate = async ({ plaintext = "", secretKey = "" }) => {
    return CryptoJS.AES.encrypt(plaintext, secretKey).toString();
};

export const decGenerate = async ({ ciphertext = "", secretKey = "" }) => {
    return CryptoJS.AES.decrypt(ciphertext, secretKey).toString(
        CryptoJS.enc.Utf8
    );
};

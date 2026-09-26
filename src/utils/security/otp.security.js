import { randomInt } from "node:crypto";

/**
 * Generates a numeric OTP code.
 * @param {number} length - number of digits (default 6)
 * @returns {string} zero-padded numeric OTP, e.g. "042917"
 */
export const generateOtp = (length = 6) => {
    const max = 10 ** length;
    const otp = randomInt(0, max);
    return String(otp).padStart(length, "0");
};
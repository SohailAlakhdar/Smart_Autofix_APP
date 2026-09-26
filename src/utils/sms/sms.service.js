import twilio from "twilio";

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendSms = async ({ phone, message }) => {
    try {
        await client.messages.create({
            to: phone,           // must be in E.164 format, e.g. +20xxxxxxxxxx
            from: process.env.TWILIO_PHONE_NUMBER,
            body: message,
        });
        return { success: true };
    } catch (err) {
        console.error("[sendSms] failed:", err.message);
        return { success: false, error: err.message };
    }
};
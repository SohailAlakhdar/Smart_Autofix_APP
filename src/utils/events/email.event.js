import EventEmitter from "events";
import { sendEmail } from "../email/send.email.js";
import { verifyEmailTemplate } from "../email/templates/verify.email.template.js";

// to make sure that the email event is faster

export const emailEventEmitter = new EventEmitter();
emailEventEmitter.on("ConfirmationEmail", async (emailData) => {
    console.log("Sending confirmation email...");
    console.log("Email Data:", emailData);
    if (!emailData.to || !emailData.otp) {
        throw new Error("Missing email data for confirmation.");
    }
    await sendEmail({
        to: emailData.to,
        subject: emailData.subject || "Confirm your email",
        text: "Please confirm your email",
        html: verifyEmailTemplate({
            otp: emailData.otp,
        }),
    }).catch((error) => {
        console.error("Error generating email template:", error);
        throw new Error("Failed to generate email template");
    });
});
emailEventEmitter.on("forgotPassword", async (emailData) => {
    console.log("Sending forgot password email...");
    console.log("Email Data:", emailData);
    await sendEmail({
        to: emailData.to || "sohailalakhdar1@gmail.com",
        subject: emailData.subject || "Reset your password",
        text: "Please reset your password",
        html: verifyEmailTemplate({
            otp: emailData.otp,
        }),
    });
});

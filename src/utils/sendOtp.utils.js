import nodemailer from "nodemailer";

export const sendEmail = async ({
    from = process.env.APP_GMAIL,
    to = "",
    cc = "",
    bcc = "",
    text = "",
    html = "",
    subject = "Smart autofix app",
    attachments = [],
} = {}) => {
    // const transporter = nodemailer.createTransport({
    //     host: "smtp.gmail.com",
    //     port: 465,
    //     secure: true,
    //     auth: {
    //         user: process.env.APP_GMAIL,
    //         pass: process.env.APP_PASSWORD,
    //     },
    // });
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.APP_GMAIL,
            pass: process.env.APP_PASSWORD,
        },
    });
    if (!to) {
        throw new Error("Missing email content or recipient.");
    }
    const info = await transporter.sendMail({
        from: `"SOHAIL🪷" <${from}>`,
        to: to || "sohailalakhdar1@gmail.com", // list of receivers
        cc, // mention someone in the email
        attachments, // file attachments
        bcc, // blind copy
        subject,
        text, // plain‑text body
        html, // HTML body
    });
    console.log("Email sent:", info.messageId);
};

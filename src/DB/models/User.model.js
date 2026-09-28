import mongoose from "mongoose";

export const roleEnum = { user: "USER", admin: "ADMIN" };

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, "Name is required"], trim: true },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Invalid email"],
        },
        phone: {
            type: String,
            required: [true, "Phone is required"],
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            select: false, // never returned unless explicitly requested
        },
        role: {
            type: String,
            enum: Object.values(roleEnum),
            default: roleEnum.user,
            required: true,
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                required: true,
                default: "Point",
            },
            coordinates: {
                type: [Number],
                required: true,
            },
        },
        profilePicture: { secure_url: String, public_id: String },

        // password reset (2 steps: verify OTP, then set new password)
        resetPasswordOtpHash: { type: String, select: false },
        resetPasswordOtpExpiresAt: Date,
        resetPasswordVerifiedAt: Date,

        freezedAt: { type: Date, default: null },
        freezedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

userSchema.index({ location: "2dsphere" });

export const UserModel =
    mongoose.models.User || mongoose.model("User", userSchema);
export default UserModel;
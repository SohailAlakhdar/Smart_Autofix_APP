import mongoose from "mongoose";
export let genderEnum = { male: "male", female: "female" };
export let roleEnum = { user: "User", admin: "Admin" };

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "name is mandatory? "],
        },
        email: {
            type: String,
            unique: true,
        },
        confirmEmail: {
            type: Date,
        },
        phone: {
            type: String,
            required: true,
        },
        age: {
            type: Number,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        forgotPasswordOtp: {
            type: String,
        },
        confirmPassword: {
            type: String,
        },
        changeLoginCredentials: {
            type: Date,
        },
        gender: {
            type: String,
            enum: {
                values: Object.values(genderEnum),
                message: "gender only allow male, female",
            },
            default: "male",
        },
        role: {
            type: String,
            enum: {
                values: Object.values(roleEnum),
            },
            default: roleEnum.user,
        },
        picture: { secure_url: String, public_id: String },
        verifyEmail: {
            type: Date,
        },
        confirmEmailOtp: {
            type: String,
        },
        lang: {
            type: String,
            enum: ["en", "ar"],
            default: "ar",
        },
        freezedAt: {
            type: Date,
        },
        freezedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

userSchema.virtual("fullname").set(function (value) {
    const [firstname, lastname] = value.split(" ") || [];
    this.set({ firstname, lastname });
})
    .get(function () {
        return `${this.firstname} ${this.lastname}`;
    });

userSchema.virtual("messages", {
    localField: "_id",
    foreignField: "receiverId",
    ref: "Message",

})
export const UserModel =
    mongoose.models.User || mongoose.model("User", userSchema);
UserModel.syncIndexes();

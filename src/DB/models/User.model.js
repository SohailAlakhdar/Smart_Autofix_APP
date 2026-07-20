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
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        confirmPassword: {
            type: String,
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                default: [0, 0],
            },
        },
        role: {
            type: String,
            enum: {
                values: Object.values(roleEnum),
            },
            default: roleEnum.user,
        },
        picture: { secure_url: String, public_id: String },
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


export const UserModel =
    mongoose.models.User || mongoose.model("User", userSchema);
UserModel.syncIndexes();

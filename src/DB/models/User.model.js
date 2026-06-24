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
        },
        password: {
            type: String,
            required: true,
        },
        confirmPassword: {
            type: String,
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

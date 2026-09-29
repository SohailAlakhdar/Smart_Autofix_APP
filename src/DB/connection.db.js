import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        console.log("MONGO_URI exists:", !!process.env.MONGO_URI);

        await mongoose.connect(process.env.MONGO_URI);

        console.log("Database Name:", mongoose.connection.name);
        console.log("DB Connected 👌");
    } catch (error) {
        console.error("Database connection failed:", error);
        throw error;
    }
};
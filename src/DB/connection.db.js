import mongoose from "mongoose";
import { asyncHandler } from "../utils/response.js";

export const connectDB =  asyncHandler( async () => {
        const result = await mongoose.connect(process.env.URI);
        console.log("Database Name:", mongoose.connection.name);
        console.log("DB Connected👌");
    });

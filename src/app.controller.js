import path from "node:path";
import * as dotenv from "dotenv";
const envFile =
    process.env.NODE_ENV === "production" ? ".env.prod" : ".env.dev";
dotenv.config({ path: path.join(`./src/config/${envFile}`) });
import express from "express";
import authController from "./modules/auth/auth.controller.js";
import userController from "./modules/user/user.controller.js";
import serviceCenterController from "./modules/serviceCenter/serviceCenter.controller.js";
import towTruckController from "./modules/towTruck/towTruck.controller.js";
import faultController from "./modules/fault/fault.controller.js";
import adminController from "./modules/admin/admin.controller.js";
import { connectDB } from "./DB/connection.db.js";
import { globalErrorHandling } from "./utils/response.js";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

const bootstrap = async (customPort) => {
    const app = express();
    const port = customPort || process.env.PORT || 5000;
    app.use(express.json());

    // CORS
    const allowedOrigins = process.env.CORS_ORIGIN || process.env.ORIGINS;
    const originList = allowedOrigins
        ? allowedOrigins.split(",").map((origin) => origin.trim())
        : ["*"];

    app.use(
        cors({
            origin: (origin, callback) => {
                if (!origin || originList.includes("*") || originList.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error("Not allowed by CORS"));
                }
            },
            credentials: true,
        })
    );

    // limiter
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: "Too many requests from this IP, please try again later",
    });
    app.use(limiter);
    // DB
    await connectDB();
    app.use(helmet()); // to avoid man in the middle
    app.use(morgan("dev"));
    app.use("/uploads", express.static(path.resolve("./src/uploads")));

    // app routing
    app.use("/service-centers", serviceCenterController);
    app.use("/tow-trucks", towTruckController);
    app.use("/auth", authController);
    app.use("/user", userController);
    app.use("/fault", faultController);
    app.use("/admin", adminController);

    // /api aliases for Flutter / Postman specs compliance
    app.use("/api/service-centers", serviceCenterController);
    app.use("/api/tow-trucks", towTruckController);
    app.use("/api/auth", authController);
    app.use("/api/users", userController);
    app.use("/api/user", userController);
    app.use("/api/faults", faultController);
    app.use("/api/fault", faultController);
    app.use("/api/admin", adminController);

    app.get("/", (req, res) => res.send("Hello World!"));
    app.all("/*dummy", (req, res, next) => {
        res.status(404).json({ message: "In-valid app routing" });
    });

    app.use(globalErrorHandling);
    const server = app.listen(port, () =>
        console.log(`Smart Autofix App is listening on port localhost:${port} ! 🪷`)
    );
    return { app, server };
};
export default bootstrap;
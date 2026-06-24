import path from "node:path";
import * as dotenv from "dotenv";
const envFile =
    process.env.NODE_ENV === "production" ? ".env.prod" : ".env.dev";
dotenv.config({ path: path.join(`./src/config/${envFile}`) });
import express from "express";
import authController from "./modules/auth/auth.controller.js";
import userController from "./modules/user/user.controller.js";
import { connectDB } from "./DB/connection.db.js";
import { globalErrorHandling } from "./utils/response.js";
// import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

const bootstrap = async () => {
    const app = express();
    const port = process.env.PORT || 5000;
    app.use(express.json());
    // console.log(mongoose.modelNames());

    // limiter
    const limiter = rateLimit({
        windowMs: 2 * 60 * 1000, // 2 minutes
        max: 5,
        message: "Too many requests from this IP, please try again later",
    });
    app.use(limiter);
    // DB
    await connectDB();
    app.use(helmet()); // to avoid man in the middle
    app.use(morgan("dev"));
    app.use("/uploads", express.static(path.resolve("./src/uploads")));
    // app routing
    app.use("/auth", authController);
    app.use("/user", userController);
    app.get("/", (req, res) => res.send("Hello World!"));
    app.all("/*dummy", (req, res, next) => {
        res.status(404).json({ message: "In-valid app routing" });
    });

    app.use(globalErrorHandling);

    // --------
    // cors
    // var whitelist = process.env.ORIGINS.split(",");
    // var corsOptions = {
    //     origin: function (origin, callback) {
    //         if (whitelist.indexOf(origin) !== -1) {
    //             callback(null, true);
    //         } else {
    //             callback(new Error("Not allowed by CORS"));
    //         }
    //     },
    // };
    // app.use(cors(corsOptions));
    // app.use(async (req, res, next) => {
    //     if (!whitelist.includes(req.header('origin'))) {
    //         return next(new Error('Not Allowed By CORS', { status: 403 }))
    //     }
    //     for (const origin of whitelist) {
    //         if (req.header('origin') == origin) {
    //             await res.header('Access-Control-Allow-Origin', origin);
    //             break;
    //         }
    //     }
    //     await res.header('Access-Control-Allow-Headers', '*')
    //     await res.header("Access-Control-Allow-Private-Network", 'true')
    //     await res.header('Access-Control-Allow-Methods', '*')
    //     console.log("Origin Work");
    //     next();
    // });
    // -------------------------

    app.listen(port, () =>
        console.log(`Example app listening on port ${port}!`)
    );
};
export default bootstrap;

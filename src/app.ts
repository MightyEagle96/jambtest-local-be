import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import cors, { CorsOptions } from "cors";
import { ConnectDatabase } from "./database";
import appRouter from "./routers/appRouter";
import crypto from "crypto";
import cookieParser from "cookie-parser";

dotenv.config();

// console.log({
//   accessToken: crypto.randomBytes(64).toString("hex"),
//   refreshToken: crypto.randomBytes(64).toString("hex"),
// });

const app = express();

// const whitelist = ["http://localhost:3000", "https://yourfrontend.com"];

// const corsOptions: CorsOptions = {
//   origin: (origin, callback) => {
//     if (!origin || whitelist.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true, // <-- IMPORTANT for cookies
// };

const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

// // Dynamically allow same subnet IPs (like 192.168.x.x)
// const corsOptions: CorsOptions = {
//   origin: (origin, callback) => {
//     if (!origin) return callback(null, true); // allow server-to-server
//     if (
//       allowedOrigins.includes(origin) ||
//       /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) || // LAN IPs
//       /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) // Private 10.x.x.x range
//     ) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
// };

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      /^http:\/\/(localhost|127\.0\.0\.1):3000$/.test(origin) ||
      /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
      /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

ConnectDatabase();
app

  .use(cookieParser())

  .use(morgan("dev"))
  .use(express.json({ limit: "50mb" }))

  .use(cors(corsOptions))

  .use("/api", appRouter)

  .listen(4000, "0.0.0.0", () => {
    console.log("server started on http://localhost:4000");
  });

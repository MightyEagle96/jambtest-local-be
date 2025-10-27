import express, { Request, Response } from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import cors, { CorsOptions } from "cors";
import { ConnectDatabase } from "./database";
import appRouter from "./routers/appRouter";
import path from "path";

import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      /^http:\/\/(localhost|127\.0\.0\.1):3000$/.test(origin) ||
      /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
      /^http:\/\/172\.16\.\d+\.\d+(:\d+)?$/.test(origin) ||
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

  .get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
  })

  .listen(4000, "0.0.0.0", () => {
    console.log("server started on http://localhost:4000");
  });

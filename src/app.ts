import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import cors, { CorsOptions } from "cors";
import { ConnectDatabase } from "./database";
import appRouter from "./routers/appRouter";
import crypto from "crypto";
import cookieParser from "cookie-parser";

import { WebSocketServer } from "ws";
import NetworkTestResponseModel from "./models/networkTestResponse";

dotenv.config();

const app = express();

const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

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

  .use("/api", appRouter);

const server = app.listen(4000, "0.0.0.0", () => {
  console.log("server started on http://localhost:4000");
});

export const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg.toString());

      // Expect a message like:
      // { type: "sendResponse", networktest: "NT1", computer: "C123", timeLeft: 50 }

      if (data.type === "sendResponse") {
        const { networktest, computer, timeLeft } = data;

        const response = await NetworkTestResponseModel.findOne({
          computer,
          networkTest: networktest,
        });

        if (response) {
          response.responses += 1;
          response.timeLeft = timeLeft;
          await response.save();
        } else {
          // console.log("No matching response found for:", {
          //   computer,
          //   networktest,
          // });
          ws.send(
            JSON.stringify({
              type: "error",
              reason: "no-matching-response",
              computer,
              networktest,
            })
          );
        }
      }
    } catch (err) {
      console.error("Invalid WS message", err);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

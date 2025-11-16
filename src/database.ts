import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/jambtest";

console.log(mongoUri);

export const ConnectDatabase = () => {
  mongoose
    .connect(mongoUri, {
      connectTimeoutMS: 60000,
      serverSelectionTimeoutMS: 60000,
    })
    .then(() => {
      console.log("Database connected successfully");
    })
    .catch((e) => {
      console.log(e);
      console.log("DB could not connect at this time. Shutting down");
      process.exit(1);
    });
};

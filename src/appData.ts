import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import fs from "fs";
import path from "path";

// dotenv.config();

// const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/jambtest";

const devDatabase = () => {
  mongoose
    .connect("mongodb://localhost:27017/jambtest", {
      connectTimeoutMS: 60000,
      serverSelectionTimeoutMS: 60000,
    })
    .then(() => {
      console.log("Database connected successfully in dev");
    })
    .catch((e) => {
      console.log(e);
      console.log("DB could not connect at this time. Shutting down");
      process.exit(1);
    });
};

async function prodDatabase() {
  const dbPath = path.join(process.cwd(), "db");

  // Ensure directory exists
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }
  const mongoServer = await MongoMemoryServer.create({
    instance: {
      ip: "127.0.0.1",
      port: 0, // random port
      dbPath: "./db",
      storageEngine: "wiredTiger",
    },
  });

  const uri = mongoServer.getUri();

  await mongoose.connect(uri);
  console.log("Database connected successfully in prod");
}

const ConnectDatabase = () => {
  if (process.env.NODE_ENV === "development") {
    devDatabase();
  } else {
    prodDatabase();
  }
};
export { ConnectDatabase };

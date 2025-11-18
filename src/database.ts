import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";

// dotenv.config();

// const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/jambtest";

// export const ConnectDatabase = () => {
//   mongoose
//     .connect("mongodb://localhost:27017/jambtest", {
//       connectTimeoutMS: 60000,
//       serverSelectionTimeoutMS: 60000,
//     })
//     .then(() => {
//       console.log("Database connected successfully");
//     })
//     .catch((e) => {
//       console.log(e);
//       console.log("DB could not connect at this time. Shutting down");
//       process.exit(1);
//     });
// };

async function ConnectDatabase() {
  const mongoServer = await MongoMemoryServer.create({
    instance: {
      ip: "127.0.0.1",
      port: 0, // random port
    },
  });

  const uri = mongoServer.getUri();

  await mongoose.connect(uri);
  console.log("Embedded MongoDB started");
}

export { ConnectDatabase };

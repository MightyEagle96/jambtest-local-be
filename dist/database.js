"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/jambtest";
const ConnectDatabase = () => {
    mongoose_1.default
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
exports.ConnectDatabase = ConnectDatabase;

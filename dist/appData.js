"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectDatabase = ConnectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// dotenv.config();
// const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/jambtest";
// const ConnectDatabase = () => {
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
function ConnectDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        const dbPath = path_1.default.join(process.cwd(), "db");
        // Ensure directory exists
        if (!fs_1.default.existsSync(dbPath)) {
            fs_1.default.mkdirSync(dbPath, { recursive: true });
        }
        const mongoServer = yield mongodb_memory_server_1.MongoMemoryServer.create({
            instance: {
                ip: "127.0.0.1",
                port: 0, // random port
                dbPath: "./db",
                storageEngine: "wiredTiger",
            },
        });
        const uri = mongoServer.getUri();
        yield mongoose_1.default.connect(uri);
        console.log("Database connected successfully");
    });
}

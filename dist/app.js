"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./database");
const appRouter_1 = __importDefault(require("./routers/appRouter"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
// console.log({
//   accessToken: crypto.randomBytes(64).toString("hex"),
//   refreshToken: crypto.randomBytes(64).toString("hex"),
// });
const app = (0, express_1.default)();
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
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin ||
            /^http:\/\/(localhost|127\.0\.0\.1):3000$/.test(origin) ||
            /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
            /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
};
(0, database_1.ConnectDatabase)();
app
    .use((0, cookie_parser_1.default)())
    .use((0, morgan_1.default)("dev"))
    .use(express_1.default.json({ limit: "50mb" }))
    .use((0, cors_1.default)(corsOptions))
    .use("/api", appRouter_1.default)
    .listen(4000, "0.0.0.0", () => {
    console.log("server started on http://localhost:4000");
});

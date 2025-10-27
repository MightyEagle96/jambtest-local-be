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
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin ||
            /^http:\/\/(localhost|127\.0\.0\.1):3000$/.test(origin) ||
            /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
            /^http:\/\/172\.16\.\d+\.\d+(:\d+)?$/.test(origin) ||
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
    .use(express_1.default.static(path_1.default.join(__dirname, "build")))
    .use((0, cors_1.default)(corsOptions))
    .use("/api", appRouter_1.default)
    .get("*", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "build", "index.html"));
})
    .listen(4000, "0.0.0.0", () => {
    console.log("server started on http://localhost:4000");
});

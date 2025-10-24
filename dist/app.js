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
exports.wss = void 0;
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./database");
const appRouter_1 = __importDefault(require("./routers/appRouter"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const ws_1 = require("ws");
const networkTestResponse_1 = __importDefault(require("./models/networkTestResponse"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];
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
    .use((0, cors_1.default)(corsOptions))
    .use("/api", appRouter_1.default);
const server = app.listen(4000, "0.0.0.0", () => {
    console.log("server started on http://localhost:4000");
});
exports.wss = new ws_1.WebSocketServer({ server });
exports.wss.on("connection", (ws) => {
    console.log("Client connected");
    ws.on("message", (msg) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const data = JSON.parse(msg.toString());
            // Expect a message like:
            // { type: "sendResponse", networktest: "NT1", computer: "C123", timeLeft: 50 }
            if (data.type === "sendResponse") {
                const { networktest, computer, timeLeft } = data;
                const response = yield networkTestResponse_1.default.findOne({
                    computer,
                    networkTest: networktest,
                });
                if (response) {
                    response.responses += 1;
                    response.timeLeft = timeLeft;
                    yield response.save();
                }
                else {
                    // console.log("No matching response found for:", {
                    //   computer,
                    //   networktest,
                    // });
                    ws.send(JSON.stringify({
                        type: "error",
                        reason: "no-matching-response",
                        computer,
                        networktest,
                    }));
                }
            }
        }
        catch (err) {
            console.error("Invalid WS message", err);
        }
    }));
    ws.on("close", () => {
        console.log("Client disconnected");
    });
});

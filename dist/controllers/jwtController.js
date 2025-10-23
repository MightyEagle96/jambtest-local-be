"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = exports.generateRefreshToken = exports.generateAccessToken = exports.tokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.tokens = {
    accessToken: "accessToken",
    refreshToken: "refreshToken",
};
const generateAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, process.env.ACCESS_TOKEN, {
        expiresIn: "1d",
    });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, process.env.REFRESH_TOKEN, {
        expiresIn: "7d",
    });
};
exports.generateRefreshToken = generateRefreshToken;
const authenticateToken = (req, res, next) => {
    try {
        const token = req.cookies.accessToken;
        if (!token) {
            return res.sendStatus(401);
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN);
        if (decoded) {
            req.centre = decoded;
        }
        next();
    }
    catch (error) {
        res.sendStatus(401);
    }
};
exports.authenticateToken = authenticateToken;

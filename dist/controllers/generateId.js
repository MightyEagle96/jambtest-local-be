"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = void 0;
const crypto_1 = __importDefault(require("crypto"));
const generateId = () => {
    const h = crypto_1.default.randomBytes(16).toString("hex");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16)}`;
};
exports.generateId = generateId;

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const computerSchema = new mongoose_1.Schema({
    serialNumber: { type: String, lowercase: true },
    macAddresses: { type: [String], lowercase: true },
    ramMB: Number,
    operatingSystem: { type: String, lowercase: true },
    processorId: { type: String, lowercase: true },
    cpuModel: { type: String, lowercase: true },
    model: { type: String, lowercase: true },
    manufacturer: { type: String, lowercase: true },
    centre: { type: mongoose_1.Schema.Types.ObjectId, ref: "Centre", required: true },
    flagged: { type: Boolean, default: false },
    status: { type: String, default: "not uploaded" },
}, { timestamps: true });
const ComputerModel = mongoose_1.default.model("Computer", computerSchema);
exports.default = ComputerModel;

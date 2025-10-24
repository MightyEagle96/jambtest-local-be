"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    duration: Number,
    examId: { type: String, lowercase: true },
    connectedComputers: { type: Number, default: 0 },
    active: { type: Boolean, default: false },
    dateCreated: { type: Date, default: new Date() },
    maxResponses: { type: Number, default: 0 },
}, { timestamps: true });
schema.pre("save", function (next) {
    this.maxResponses = this.duration / 1000 / 60;
    next();
});
const NetworkTestModel = (0, mongoose_1.model)("NetworkTest", schema);
exports.default = NetworkTestModel;

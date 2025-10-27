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
    timeActivated: { type: Date, default: null },
    timeEnded: { type: Date, default: null },
    ended: { type: Boolean, default: false },
    totalNetworkLosses: { type: Number, default: 0 },
    computersWithNetworkLosses: { type: Number, default: 0 },
    endedComputers: { type: Number, default: 0 },
    lostInTransport: { type: Number, default: 0 },
    responseThroughput: String,
    timeUploaded: { type: Date },
}, { timestamps: true });
schema.pre("save", function (next) {
    this.maxResponses = this.duration / 1000 / 60;
    next();
});
const NetworkTestModel = (0, mongoose_1.model)("NetworkTest", schema);
exports.default = NetworkTestModel;

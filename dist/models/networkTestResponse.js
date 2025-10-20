"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    networkTest: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "NetworkTest",
        required: true,
    },
    computer: { type: mongoose_1.Schema.Types.ObjectId, ref: "Computer", required: true },
    loggedInAt: Date,
    ipAddress: String,
    responses: Number,
    timeLeft: Number,
}, { timestamps: true });
const NetworkTestModel = (0, mongoose_1.model)("NetworkTest", schema);
exports.default = NetworkTestModel;

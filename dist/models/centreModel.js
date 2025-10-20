"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    ReferenceNumber: { type: String, lowercase: true },
    TempReferenceNumber: { type: String, lowercase: true },
    CentreName: { type: String, lowercase: true },
    State: { type: String, lowercase: true },
    CentreCapacity: Number,
    AdminName: { type: String, lowercase: true },
    AdminPhone: { type: String, lowercase: true },
    AdminEmail: { type: String, lowercase: true },
    DateCreated: Date,
});
schema.pre("save", function (next) {
    this.DateCreated = new Date();
    next();
});
const CentreModel = (0, mongoose_1.model)("Centre", schema);
exports.default = CentreModel;

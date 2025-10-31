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
exports.viewNetworkTests = exports.createNetworkTest = void 0;
const httpService_1 = require("../httpService");
const networkTest_1 = __importDefault(require("../models/networkTest"));
const createNetworkTest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const response = yield httpService_1.httpService.post("networktest/create", req.body, {
        headers: { centreid: (_a = req.centre) === null || _a === void 0 ? void 0 : _a._id.toString() },
    });
    res.status(response.status).send(response.data);
});
exports.createNetworkTest = createNetworkTest;
const viewNetworkTests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const response = yield httpService_1.httpService.get("networktest/viewcentretests", {
            headers: { centreid: (_a = req.centre) === null || _a === void 0 ? void 0 : _a._id.toString() },
        });
        if (response.status === 200) {
            for (const test of response.data) {
                yield networkTest_1.default.updateOne({ _id: test._id }, // or testId if different
                { $set: test }, { upsert: true });
            }
            const remoteIds = response.data.map((t) => t._id);
            yield networkTest_1.default.deleteMany({ _id: { $nin: remoteIds } });
            return res.send(response.data);
        }
        return res.status(response.status).send(response.data);
    }
    catch (err) {
        console.error("Error viewing network tests:", err.message);
        return res.status(500).send({ error: "Failed to fetch network tests" });
    }
});
exports.viewNetworkTests = viewNetworkTests;

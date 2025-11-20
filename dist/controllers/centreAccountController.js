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
exports.centreDetail = exports.centreDashboard = exports.getRefreshToken = exports.centreProfile = exports.logoutAccount = exports.loginAccount = void 0;
const httpService_1 = require("../httpService");
const centreModel_1 = __importDefault(require("../models/centreModel"));
const jwtController_1 = require("./jwtController");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const computerModel_1 = __importDefault(require("../models/computerModel"));
const networkTest_1 = __importDefault(require("../models/networkTest"));
const networkTestResponse_1 = __importDefault(require("../models/networkTestResponse"));
const networkTestControllerAdmin_1 = require("./networkTestControllerAdmin");
const loginAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield httpService_1.httpService.post("centre/login", req.body);
        if (response.status !== 200)
            return (res
                // .clearCookie("accessToken")
                // .clearCookie("refreshToken")
                .status(response.status)
                .send(response.data));
        const { centre, computers, networkTests } = response.data;
        // Defensive check
        if (!centre || !computers || !networkTests)
            return res.status(400).send("Incomplete response data");
        // ✅ Clear old data first
        yield Promise.all([
            centreModel_1.default.deleteMany(),
            computerModel_1.default.deleteMany(),
            networkTest_1.default.deleteMany(),
        ]);
        // ✅ Insert new data
        yield centreModel_1.default.create(centre);
        yield computerModel_1.default.insertMany(computers);
        yield networkTest_1.default.insertMany(networkTests);
        // ✅ Issue tokens
        const accessToken = (0, jwtController_1.generateAccessToken)(Object.assign(Object.assign({}, centre), { role: "admin" }));
        const refreshToken = (0, jwtController_1.generateRefreshToken)(Object.assign(Object.assign({}, centre), { role: "admin" }));
        for (const interval of networkTestControllerAdmin_1.activeTestIntervals.values()) {
            clearInterval(interval);
        }
        networkTestControllerAdmin_1.activeTestIntervals.clear();
        console.log("Intervals flushed");
        res
            .cookie("accessToken", accessToken, {
            httpOnly: false,
            secure: true,
            sameSite: "none",
            maxAge: 1000 * 60 * 60 * 24,
        })
            .cookie("refreshToken", refreshToken, {
            httpOnly: false,
            secure: true,
            sameSite: "none",
            maxAge: 1000 * 60 * 60 * 24 * 7,
        })
            .send("Success");
    }
    catch (error) {
        console.error("Login error:", error.message);
        res.status(500).send("Something went wrong");
    }
});
exports.loginAccount = loginAccount;
const logoutAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield Promise.all([
        centreModel_1.default.deleteMany(),
        computerModel_1.default.deleteMany(),
        networkTest_1.default.deleteMany(),
        networkTestResponse_1.default.deleteMany(),
    ]);
    for (const interval of networkTestControllerAdmin_1.activeTestIntervals.values()) {
        clearInterval(interval);
    }
    networkTestControllerAdmin_1.activeTestIntervals.clear();
    console.log("Intervals flushed");
    res.clearCookie("accessToken").clearCookie("refreshToken").send("Success");
});
exports.logoutAccount = logoutAccount;
const centreProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send(req.centre);
});
exports.centreProfile = centreProfile;
const getRefreshToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = req.cookies[jwtController_1.tokens.refreshToken];
    if (!refreshToken) {
        return res.sendStatus(401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN);
        const centre = yield centreModel_1.default.findById(decoded._id).lean();
        if (!centre) {
            return res.sendStatus(401);
        }
        const newAccessToken = (0, jwtController_1.generateAccessToken)(Object.assign(Object.assign({}, centre), { role: "admin" }));
        const newRefreshToken = (0, jwtController_1.generateRefreshToken)(Object.assign(Object.assign({}, centre), { role: "admin" }));
        res
            .cookie("accessToken", newAccessToken, {
            httpOnly: false,
            secure: true,
            sameSite: "none", // for cross-site cookies (frontend <-> backend on diff domains)
            maxAge: 1000 * 60 * 60 * 24,
        })
            .cookie("refreshToken", newRefreshToken, {
            httpOnly: false,
            secure: true,
            sameSite: "none", // for cross-site cookies (frontend <-> backend on diff domains)
            maxAge: 1000 * 60 * 60 * 24 * 7,
        })
            .send("Success");
    }
    catch (error) {
        res.status(401).send("Invalid refresh token");
    }
    //  res.send(req.cookies[tokens.refresh_token]);
});
exports.getRefreshToken = getRefreshToken;
const centreDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const response = yield (0, httpService_1.httpService)("centre/dashboard", {
        headers: { centreid: (_a = req.centre) === null || _a === void 0 ? void 0 : _a._id.toString() },
    });
    res.status(response.status).send(response.data);
});
exports.centreDashboard = centreDashboard;
const centreDetail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const centre = yield centreModel_1.default.findOne();
    res.send(centre);
});
exports.centreDetail = centreDetail;

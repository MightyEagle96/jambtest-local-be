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
exports.retrieveNetworkTestSummary = exports.networkPing = exports.uploadNetworkTest = exports.computerListUnderNetworkTest = exports.networkTestDashboard = exports.endNetworkTestForAdmin = exports.toggleActivation = exports.deleteNetworkTest = exports.viewNetworkTests = exports.createNetworkTest = void 0;
const httpService_1 = require("../httpService");
const centreModel_1 = __importDefault(require("../models/centreModel"));
const networkTest_1 = __importDefault(require("../models/networkTest"));
const networkTestResponse_1 = __importDefault(require("../models/networkTestResponse"));
const mongoose_1 = __importDefault(require("mongoose"));
const computerModel_1 = __importDefault(require("../models/computerModel"));
const generateId_1 = require("./generateId");
const activeTestIntervals = new Map();
const checkLastActive = (networkTest) => __awaiter(void 0, void 0, void 0, function* () {
    // Find computers not updated in the last 1 minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const staleComputers = yield networkTestResponse_1.default.find({
        networkTest: networkTest,
        updatedAt: { $lt: oneMinuteAgo },
    });
    for (const c of staleComputers) {
        if (c.status === "connected") {
            c.status = "disconnected";
            c.networkLosses += 1;
            yield c.save();
        }
    }
});
const createNetworkTest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    /**
     * Check for uploaded computers
     * Check for not uploaded test
     */
    var _a;
    const [computers, uploadedComputers] = yield Promise.all([
        computerModel_1.default.countDocuments(),
        computerModel_1.default.countDocuments({ status: "uploaded" }),
    ]);
    if (uploadedComputers === 0) {
        return res.status(400).send("No computers uploaded");
    }
    if (computers !== uploadedComputers) {
        return res
            .status(400)
            .send("All computers must be uploaded before creating a test");
    }
    const examId = (0, generateId_1.generateId)();
    req.body.duration = Number(req.body.duration * 60 * 1000);
    req.body.centre = (_a = req.centre) === null || _a === void 0 ? void 0 : _a._id.toString();
    req.body.examId = examId;
    yield networkTest_1.default.create(req.body);
    res.send("New network test created");
});
exports.createNetworkTest = createNetworkTest;
const viewNetworkTests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const page = (req.query.page || 1);
        const limit = (req.query.limit || 50);
        const networkTests = yield networkTest_1.default.find({
            centre: (_a = req.centre) === null || _a === void 0 ? void 0 : _a._id.toString(),
        })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        const total = yield networkTest_1.default.countDocuments({
            centre: (_b = req.centre) === null || _b === void 0 ? void 0 : _b._id.toString(),
        });
        const mappedNetworkTests = networkTests.map((networkTest, i) => {
            return Object.assign(Object.assign({}, networkTest), { id: (page - 1) * limit + i + 1 });
        });
        res.send({ total, networkTests: mappedNetworkTests });
    }
    catch (error) {
        res.status(500).send("Internal server error");
    }
});
exports.viewNetworkTests = viewNetworkTests;
const deleteNetworkTest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const testId = req.query.id;
        const networkTest = yield networkTest_1.default.findById(testId);
        if (!networkTest) {
            return res.status(404).send("Network test not found");
        }
        if (networkTest.active) {
            return res.status(400).send("Please end this test before you delete it");
        }
        // Clear the interval for this test, if it exists
        const intervalId = activeTestIntervals.get(testId);
        if (intervalId) {
            clearInterval(intervalId);
            activeTestIntervals.delete(testId);
        }
        yield networkTest_1.default.findByIdAndDelete(testId);
        yield networkTestResponse_1.default.deleteMany({ networkTest: testId });
        res.send("Network test deleted successfully");
        // // Delete the network test and related responses
        // const response = await httpService.delete("networktest/delete", {
        //   params: { testid: req.query.id, centre: req.centre?._id.toString() },
        // });
        // res.status(response.status).send(response.data);
    }
    catch (error) {
        console.error("Delete network test error:", error);
        res.status(500).send("Internal server error");
    }
});
exports.deleteNetworkTest = deleteNetworkTest;
const toggleActivation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const testId = req.query.id;
        if (!testId) {
            return res.status(400).send("Invalid test ID");
        }
        const test = yield networkTest_1.default.findById(testId);
        console.log(test);
        if (!test) {
            return res.status(404).send("Test not found");
        }
        // 🔴 Deactivate if active
        if (test.active) {
            if (!test.ended) {
                return res.status(400).send("Cannot deactivate — test not ended yet.");
            }
            const intervalId = activeTestIntervals.get(testId);
            if (intervalId) {
                clearInterval(intervalId);
                activeTestIntervals.delete(testId);
            }
            test.active = false;
            test.ended = true;
            test.timeEnded = new Date();
            yield test.save();
            return res.send("Test deactivated successfully.");
        }
        // 🟢 Activate new test
        const ongoingTest = yield networkTest_1.default.findOne({
            active: true,
            ended: false,
        });
        if (ongoingTest) {
            return res
                .status(400)
                .send("Another test is currently active and not yet ended.");
        }
        // Clear any residual interval (safety)
        if (activeTestIntervals.has(testId)) {
            clearInterval(activeTestIntervals.get(testId));
            activeTestIntervals.delete(testId);
        }
        yield networkTest_1.default.updateOne({ _id: testId }, { $set: { active: true, ended: false, timeActivated: new Date() } });
        test.active = true;
        test.ended = false;
        test.timeActivated = new Date();
        yield test.save();
        const intervalId = setInterval(() => {
            checkLastActive(testId);
            console.log(`[${new Date().toISOString()}] Background check for ${testId}`);
        }, 10 * 1000);
        activeTestIntervals.set(testId, intervalId);
        return res.send("Test activated successfully.");
    }
    catch (error) {
        console.error("Toggle activation error:", error);
        res.status(500).send("Internal server error.");
    }
});
exports.toggleActivation = toggleActivation;
const endNetworkTestForAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const testId = req.query.id;
        const networkTest = yield networkTest_1.default.findById(testId);
        if (!networkTest) {
            return res.status(404).send("Test not found"); // Updated to 404 for consistency
        }
        // Clear the interval for this test, if it exists
        const intervalId = activeTestIntervals.get(testId);
        if (intervalId) {
            clearInterval(intervalId);
            activeTestIntervals.delete(testId);
        }
        const [totalComputers, connected, computersWithNetworkLosses, totalNetworkLosses, ended, disconnected, totalResponses,] = yield Promise.all([
            networkTestResponse_1.default.countDocuments({
                networkTest: testId,
            }),
            networkTestResponse_1.default.countDocuments({
                networkTest: testId,
                status: "connected",
            }),
            networkTestResponse_1.default.countDocuments({
                networkTest: testId,
                networkLosses: { $gt: 0 },
            }),
            networkTestResponse_1.default.aggregate([
                {
                    $match: {
                        networkTest: new mongoose_1.default.Types.ObjectId(testId),
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$networkLosses" },
                    },
                },
            ]),
            networkTestResponse_1.default.countDocuments({
                networkTest: testId,
                status: "ended",
            }),
            networkTestResponse_1.default.countDocuments({
                networkTest: testId,
                status: "disconnected",
            }),
            networkTestResponse_1.default.aggregate([
                {
                    $match: {
                        networkTest: new mongoose_1.default.Types.ObjectId(testId),
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$responses" },
                    },
                },
            ]),
        ]);
        yield networkTest_1.default.updateOne({ _id: testId }, {
            $set: {
                active: false,
                ended: true,
                timeEnded: new Date(),
                totalNetworkLosses: ((_a = totalNetworkLosses[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
                computersWithNetworkLosses: computersWithNetworkLosses,
                connectedComputers: totalComputers,
                endedComputers: ended,
                lostInTransport: disconnected + connected,
                responseThroughput: (((((_b = totalResponses[0]) === null || _b === void 0 ? void 0 : _b.total) || 0) /
                    ((totalComputers * (networkTest === null || networkTest === void 0 ? void 0 : networkTest.duration)) / 1000 / 60)) *
                    100).toFixed(2),
            },
        });
        res.send("Test ended successfully");
    }
    catch (error) {
        console.error("End network test error:", error);
        res.status(500).send("Server error");
    }
});
exports.endNetworkTestForAdmin = endNetworkTestForAdmin;
const networkTestDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const networkTest = yield networkTest_1.default.findById(req.query.id);
        if (!networkTest) {
            return res.status(400).send("Test not found");
        }
        const [totalComputers, 
        //  networkTest,
        connected, computersWithNetworkLosses, totalNetworkLosses, ended, disconnected, totalResponses,] = yield Promise.all([
            networkTestResponse_1.default.countDocuments({
                networkTest: req.query.id,
            }),
            // NetworkTestModel.findById(req.query.id),
            networkTestResponse_1.default.countDocuments({
                networkTest: req.query.id,
                status: "connected",
            }),
            networkTestResponse_1.default.countDocuments({
                networkTest: req.query.id,
                networkLosses: { $gt: 0 },
            }),
            networkTestResponse_1.default.aggregate([
                {
                    $match: {
                        networkTest: new mongoose_1.default.Types.ObjectId((_a = req.query.id) === null || _a === void 0 ? void 0 : _a.toString()),
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$networkLosses" },
                    },
                },
            ]),
            networkTestResponse_1.default.countDocuments({
                networkTest: req.query.id,
                status: "ended",
            }),
            networkTestResponse_1.default.countDocuments({
                networkTest: req.query.id,
                status: "disconnected",
            }),
            networkTestResponse_1.default.aggregate([
                {
                    $match: {
                        networkTest: new mongoose_1.default.Types.ObjectId((_b = req.query.id) === null || _b === void 0 ? void 0 : _b.toString()),
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$responses" },
                    },
                },
            ]),
        ]);
        res.send({
            totalComputers,
            connected,
            computersWithNetworkLosses,
            totalNetworkLosses: ((_c = totalNetworkLosses[0]) === null || _c === void 0 ? void 0 : _c.total) || 0,
            ended,
            disconnected,
            totalResponses: ((_d = totalResponses[0]) === null || _d === void 0 ? void 0 : _d.total) || 0,
            expected: (totalComputers * (networkTest === null || networkTest === void 0 ? void 0 : networkTest.duration)) / 1000 / 60,
            responseThroughput: (((((_e = totalResponses[0]) === null || _e === void 0 ? void 0 : _e.total) || 0) /
                ((totalComputers * (networkTest === null || networkTest === void 0 ? void 0 : networkTest.duration)) / 1000 / 60)) *
                100).toFixed(2),
        });
    }
    catch (error) {
        res.status(500).send("Server error");
    }
});
exports.networkTestDashboard = networkTestDashboard;
const computerListUnderNetworkTest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = (req.query.page || 1);
    const limit = (req.query.limit || 50);
    const computerList = yield networkTestResponse_1.default.find({
        networkTest: req.params.id,
    })
        .populate("computer")
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    const total = yield networkTestResponse_1.default.countDocuments({
        networkTest: req.params.id,
    });
    const mappedComputerList = computerList.map((computer, i) => {
        return Object.assign(Object.assign({}, computer), { id: (page - 1) * limit + i + 1 });
    });
    res.send({ total, computers: mappedComputerList });
});
exports.computerListUnderNetworkTest = computerListUnderNetworkTest;
const uploadNetworkTest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        //upload the network test and the participating computers
        const testId = req.query.id;
        const networkTest = yield networkTest_1.default.findById(testId);
        const responses = yield networkTestResponse_1.default.find({
            networkTest: testId,
        });
        const response = yield httpService_1.httpService.post("networktest/uploadtest", { networkTest, responses }, { params: { centre: (_a = req.centre) === null || _a === void 0 ? void 0 : _a._id.toString() } });
        if (response.status === 200) {
            yield networkTest_1.default.updateOne({ _id: testId }, { status: "uploaded", timeUploaded: new Date() });
        }
        res.status(response.status).send(response.data);
    }
    catch (error) {
        res.status(500).send("Internal server error");
    }
});
exports.uploadNetworkTest = uploadNetworkTest;
const networkPing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const activeTest = yield networkTest_1.default.findOne({ active: true });
    if (!activeTest) {
        return res.sendStatus(404);
    }
    res.send("pong");
});
exports.networkPing = networkPing;
const retrieveNetworkTestSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const networkTest = yield networkTest_1.default.findById(req.query.id).lean();
        if (!networkTest) {
            return res.status(400).send("Test not found");
        }
        const centre = yield centreModel_1.default.findOne({}).lean();
        if (!centre) {
            return res.status(400).send("Centre not found");
        }
        const summary = {
            testId: networkTest.examId,
            testedComputers: networkTest.connectedComputers,
            capacity: centre.CentreCapacity,
            capacityMatched: networkTest.connectedComputers >= centre.CentreCapacity,
            networkLosses: networkTest.totalNetworkLosses,
            networkLossesThreshold: networkTest.totalNetworkLosses < 45,
            duration: networkTest.duration,
            durationMatched: networkTest.duration >= 60 * 60 * 1000,
            responsesPercentage: networkTest.responseThroughput,
            responsesPercentageMatched: Number(networkTest.responseThroughput) >= 90,
            canUpload: networkTest.connectedComputers >= centre.CentreCapacity &&
                networkTest.totalNetworkLosses < 45 &&
                networkTest.duration >= 60 * 60 * 1000 &&
                Number(networkTest.responseThroughput) >= 90,
            datedCreated: networkTest.dateCreated,
            timeActivated: networkTest.timeActivated,
            timeEnded: networkTest.timeEnded,
            timeUploaded: networkTest.timeUploaded,
        };
        //console.log(summary);
        res.send(summary);
    }
    catch (error) {
        res.sendStatus(500);
    }
});
exports.retrieveNetworkTestSummary = retrieveNetworkTestSummary;

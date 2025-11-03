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
exports.computerListUnderNetworkTest = exports.networkTestDashboard = exports.endNetworkTestForAdmin = exports.toggleActivation = exports.deleteNetworkTest = exports.viewNetworkTests = exports.createNetworkTest = void 0;
const httpService_1 = require("../httpService");
const networkTest_1 = __importDefault(require("../models/networkTest"));
const networkTestResponse_1 = __importDefault(require("../models/networkTestResponse"));
const mongoose_1 = __importDefault(require("mongoose"));
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
    var _a;
    const response = yield httpService_1.httpService.post("networktest/create", req.body, {
        headers: { centreid: (_a = req.centre) === null || _a === void 0 ? void 0 : _a._id.toString() },
    });
    res.status(response.status).send(response.data);
});
exports.createNetworkTest = createNetworkTest;
const viewNetworkTests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const response = yield httpService_1.httpService.get("networktest/viewcentretests", {
            headers: { centreid: (_b = req.centre) === null || _b === void 0 ? void 0 : _b._id.toString() },
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
const deleteNetworkTest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const testId = req.query.id;
        const networkTest = yield networkTest_1.default.findById(testId);
        if (!networkTest) {
            return res.status(404).send("Network test not found");
        }
        // if (!networkTest.ended) {
        //   return res.status(400).send("Please end this test before you delete it");
        // }
        if (networkTest.active) {
            return res.status(400).send("Please end this test before you delete it");
        }
        // Clear the interval for this test, if it exists
        const intervalId = activeTestIntervals.get(testId);
        if (intervalId) {
            clearInterval(intervalId);
            activeTestIntervals.delete(testId);
        }
        // Delete the network test and related responses
        const response = yield httpService_1.httpService.delete("networktest/delete", {
            params: { testid: req.query.id, centre: (_c = req.centre) === null || _c === void 0 ? void 0 : _c._id.toString() },
        });
        res.status(response.status).send(response.data);
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
        const test = yield networkTest_1.default.findById(testId);
        if (!test) {
            return res.status(404).send("Test not found");
        }
        // If the test is currently active — deactivate it
        if (test.active) {
            if (!test.ended) {
                return res
                    .status(400)
                    .send("Cannot deactivate this test — it has not been ended.");
            }
            // Clear the interval for this test
            const intervalId = activeTestIntervals.get(testId);
            if (intervalId) {
                clearInterval(intervalId);
                activeTestIntervals.delete(testId);
            }
            test.active = false;
            test.timeEnded = new Date();
            test.ended = true;
            yield test.save();
            return res.send("Test deactivated successfully.");
        }
        // Check for other active tests
        const ongoingTest = yield networkTest_1.default.findOne({
            active: true,
            ended: false,
        });
        if (ongoingTest) {
            return res
                .status(400)
                .send("Another test is currently active and has not been ended.");
        }
        // Activate the test and start background check
        test.active = true;
        test.ended = false;
        //test.timeEnded = ;
        test.timeActivated = new Date();
        yield test.save();
        // Start the interval for checkLastActive (e.g., every 10 seconds)
        const intervalId = setInterval(() => {
            checkLastActive(testId);
            console.log("Background check for test", testId);
        }, 10 * 1000); // Adjust interval as needed (10 seconds here)
        // Store the interval ID
        activeTestIntervals.set(testId, intervalId);
        res.send("Test activated successfully.");
    }
    catch (error) {
        console.error("Toggle activation error:", error);
        res.status(500).send("Internal server error.");
    }
});
exports.toggleActivation = toggleActivation;
const endNetworkTestForAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e;
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
                totalNetworkLosses: ((_d = totalNetworkLosses[0]) === null || _d === void 0 ? void 0 : _d.total) || 0,
                computersWithNetworkLosses: computersWithNetworkLosses,
                connectedComputers: totalComputers,
                endedComputers: ended,
                lostInTransport: disconnected + connected,
                responseThroughput: (((((_e = totalResponses[0]) === null || _e === void 0 ? void 0 : _e.total) || 0) /
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
    var _f, _g, _h, _j, _k;
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
                        networkTest: new mongoose_1.default.Types.ObjectId((_f = req.query.id) === null || _f === void 0 ? void 0 : _f.toString()),
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
                        networkTest: new mongoose_1.default.Types.ObjectId((_g = req.query.id) === null || _g === void 0 ? void 0 : _g.toString()),
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
            totalNetworkLosses: ((_h = totalNetworkLosses[0]) === null || _h === void 0 ? void 0 : _h.total) || 0,
            ended,
            disconnected,
            totalResponses: ((_j = totalResponses[0]) === null || _j === void 0 ? void 0 : _j.total) || 0,
            expected: (totalComputers * (networkTest === null || networkTest === void 0 ? void 0 : networkTest.duration)) / 1000 / 60,
            responseThroughput: (((((_k = totalResponses[0]) === null || _k === void 0 ? void 0 : _k.total) || 0) /
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

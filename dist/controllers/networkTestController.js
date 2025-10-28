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
exports.endNetworkTestForAdmin = exports.networkTestDashboard = exports.deleteNetworkTest = exports.viewMyComputerResponse = exports.endNetworkTest = exports.questionAndResponseCount = exports.sendResponses = exports.computerListUnderNetworkTest = exports.beginNetworkTest = exports.networkTestValidation = exports.viewNetworkTest = exports.toggleActivation = exports.viewNetworkTests = exports.createNetworkTest = void 0;
const uuid_1 = require("uuid");
const networkTest_1 = __importDefault(require("../models/networkTest"));
const computerModel_1 = __importDefault(require("../models/computerModel"));
const centreModel_1 = __importDefault(require("../models/centreModel"));
const DataQueue_1 = require("./DataQueue");
const networkTestResponse_1 = __importDefault(require("../models/networkTestResponse"));
const mongoose_1 = __importDefault(require("mongoose"));
const questions_1 = __importDefault(require("./questions"));
const activeTestIntervals = new Map();
const id = (0, uuid_1.v4)();
const createNetworkTest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const uploadedSystems = yield computerModel_1.default.countDocuments({
        status: "uploaded",
    });
    if (uploadedSystems === 0) {
        return res.status(400).send("No uploaded systems");
    }
    yield networkTest_1.default.create(Object.assign(Object.assign({}, req.body), { examId: id, duration: req.body.duration * 60 * 1000 }));
    res.send("Success");
});
exports.createNetworkTest = createNetworkTest;
const viewNetworkTests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const networkTests = yield networkTest_1.default.find().lean();
    const mappedTests = networkTests.map((test, i) => {
        return Object.assign(Object.assign({}, test), { duration: test.duration / 1000 / 60, id: i + 1 });
    });
    res.send(mappedTests);
});
exports.viewNetworkTests = viewNetworkTests;
// export const toggleActivation = async (req: Request, res: Response) => {
//   try {
//     const testId = req.query.id as string;
//     const test = await NetworkTestModel.findById(testId);
//     if (!test) {
//       return res.status(404).send("Test not found");
//     }
//     // 💡 If the test is currently active — it means we’re deactivating it.
//     if (test.active) {
//       if (!test.ended) {
//         return res
//           .status(400)
//           .send("Cannot deactivate this test — it has not been ended.");
//       }
//       test.active = false;
//       await test.save();
//       return res.send("Test deactivated successfully.");
//     }
//     // 💡 If we're activating a test — check that no other active test exists that hasn’t ended.
//     const ongoingTest = await NetworkTestModel.findOne({
//       active: true,
//       ended: false,
//     });
//     if (ongoingTest) {
//       return res
//         .status(400)
//         .send("Another test is currently active and has not been ended.");
//     }
//     // ✅ Safe to activate
//     test.active = true;
//     test.timeActivated = new Date();
//     await test.save();
//     res.send("Test activated successfully.");
//   } catch (error) {
//     console.error("Toggle activation error:", error);
//     res.status(500).send("Internal server error.");
//   }
// };
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
const viewNetworkTest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const test = yield networkTest_1.default.findById(req.params.id);
    if (!test) {
        return res.status(400).send("Test not found");
    }
    res.send(test);
});
exports.viewNetworkTest = viewNetworkTest;
const errorMessages = {
    noCentre: "No centre found, contact administrator",
    noComputer: "Computer not yet registered",
    noActiveTest: "There is no active network test",
    computerFlagged: "This computer has been flagged for an infraction",
    notUploaded: "This computer is not yet registered on the JAMB test network",
    alreadyTested: "This computer has already been tested",
};
const networkTestValidation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const centre = yield centreModel_1.default.findOne();
    const body = req.body;
    // Normalize for consistent comparison
    const serialNumber = (_a = body.serialNumber) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    const processorId = (_b = body.processorId) === null || _b === void 0 ? void 0 : _b.toLowerCase();
    const macAddresses = (body.macAddresses || []).map((m) => m.toLowerCase());
    if (!centre) {
        return res.status(400).send(errorMessages.noCentre);
    }
    const computer = yield computerModel_1.default.findOne({
        $and: [
            { serialNumber },
            { processorId },
            { macAddresses: { $in: macAddresses } },
        ],
    });
    if (!computer) {
        return res.status(400).send(errorMessages.noComputer);
    }
    if (computer.status !== "uploaded") {
        return res.status(400).send(errorMessages.notUploaded);
    }
    if (computer.flagged) {
        return res.status(400).send(errorMessages.computerFlagged);
    }
    const activeTest = yield networkTest_1.default.findOne({ active: true });
    if (!activeTest) {
        return res.status(400).send(errorMessages.noActiveTest);
    }
    if (activeTest) {
        const response = yield networkTestResponse_1.default.findOne({
            computer: computer._id.toString(),
            networkTest: activeTest._id.toString(),
            status: "ended",
        });
        if (response) {
            return res.status(400).send(errorMessages.alreadyTested);
        }
    }
    req.headers.computer = computer._id.toString();
    req.headers.networktest = activeTest._id.toString();
    next();
    //res.send("Success");
});
exports.networkTestValidation = networkTestValidation;
const dataQueue = new DataQueue_1.ConcurrentJobQueue({
    concurrency: 1,
    maxQueueSize: 100,
    retries: 0,
    retryDelay: 3000,
    shutdownTimeout: 30000,
});
const beginNetworkTest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send({
        networkTest: req.headers.networktest,
        computer: req.headers.computer,
    });
    dataQueue.enqueue(() => __awaiter(void 0, void 0, void 0, function* () {
        const networkTest = yield networkTest_1.default.findById(req.headers.networktest);
        const response = yield networkTestResponse_1.default.findOne({
            computer: req.headers.computer,
            networkTest: req.headers.networktest,
        });
        if (!response && networkTest) {
            yield networkTestResponse_1.default.create({
                computer: req.headers.computer,
                networkTest: req.headers.networktest,
                ipAddress: req.ip,
                responses: 0,
                timeLeft: networkTest.duration,
                loggedInAt: new Date(),
            });
        }
    }));
});
exports.beginNetworkTest = beginNetworkTest;
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
        return Object.assign(Object.assign({}, computer), { id: i + 1 });
    });
    res.send({ total, computers: mappedComputerList });
});
exports.computerListUnderNetworkTest = computerListUnderNetworkTest;
const responseQueue = new DataQueue_1.ConcurrentJobQueue({
    concurrency: 1,
    maxQueueSize: 100,
    retries: 0,
    retryDelay: 3000,
    shutdownTimeout: 30000,
});
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
const sendResponses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield responseQueue.enqueue(() => __awaiter(void 0, void 0, void 0, function* () {
            const { computer, networktest, timeLeft } = req.body;
            const networkTestData = yield networkTest_1.default.findById(networktest);
            if (!networkTestData) {
                console.log("No matching test found for:", networktest);
                // Explicitly return 404 so frontend can act accordingly
                return res.status(404).send("No matching test found");
            }
            const response = yield networkTestResponse_1.default.findOne({
                computer,
                networkTest: networktest,
            });
            if (!response) {
                console.log("No matching response found for:", {
                    computer,
                    networktest,
                });
                // Explicitly return 404 so frontend can act accordingly
                return res.status(404).send({ message: "No matching response found" });
            }
            // Update existing record
            if (response.responses + 1 <= networkTestData.maxResponses) {
                response.responses += 1;
            }
            response.timeLeft = timeLeft;
            response.status = "connected";
            yield response.save();
            res.send("Success");
        }));
    }
    catch (error) {
        console.error("Error in sendResponses:", error);
        res.status(500).send({ message: "Server error" });
    }
});
exports.sendResponses = sendResponses;
const questionAndResponseCount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const [response, networkTest] = yield Promise.all([
        networkTestResponse_1.default.findOne({
            computer: req.body.computer,
            networkTest: req.body.networktest,
        }),
        networkTest_1.default.findById(req.body.networktest),
    ]);
    if (!response) {
        return res.status(404).send("Response not found");
    }
    if (!networkTest) {
        return res.status(404).send("Test not found");
    }
    function selectRandomQuestion() {
        const randomIndex = Math.floor(Math.random() * questions_1.default.length);
        return questions_1.default[randomIndex];
    }
    res.send(Object.assign(Object.assign({}, selectRandomQuestion()), { responses: response.responses, maxResponses: networkTest.maxResponses }));
});
exports.questionAndResponseCount = questionAndResponseCount;
const endQueue = new DataQueue_1.ConcurrentJobQueue({
    concurrency: 1,
    maxQueueSize: 100,
    retries: 0,
    retryDelay: 3000,
    shutdownTimeout: 30000,
});
const endNetworkTest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    endQueue.enqueue(() => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield networkTestResponse_1.default.findOne({
            computer: req.body.computer,
            networkTest: req.body.networktest,
        });
        if (response) {
            response.timeLeft = 0;
            response.endedAt = new Date();
            response.status = "ended";
            yield response.save();
        }
    }));
    res.send("Success");
});
exports.endNetworkTest = endNetworkTest;
const viewMyComputerResponse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield networkTestResponse_1.default.findOne({
        computer: req.headers.computer,
        networkTest: req.headers.networktest,
    }).populate(["networkTest", "computer"]);
    if (!response) {
        return res.status(404).send("Response not found");
    }
    res.send(response);
});
exports.viewMyComputerResponse = viewMyComputerResponse;
// export const deleteNetworkTest = async (req: Request, res: Response) => {
//   const networkTest = await NetworkTestModel.findById(req.query.id);
//   if (networkTest && !networkTest.ended) {
//     return res.status(400).send("Please end this test before you delete it");
//   }
//   await Promise.all([
//     NetworkTestModel.deleteOne({ _id: req.query.id }),
//     NetworkTestResponseModel.deleteMany({ networkTest: req.query.id }),
//   ]);
//   res.send("Network test deleted");
// };
const deleteNetworkTest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const testId = req.query.id;
        const networkTest = yield networkTest_1.default.findById(testId);
        if (!networkTest) {
            return res.status(404).send("Network test not found");
        }
        if (!networkTest.ended) {
            return res.status(400).send("Please end this test before you delete it");
        }
        // Clear the interval for this test, if it exists
        const intervalId = activeTestIntervals.get(testId);
        if (intervalId) {
            clearInterval(intervalId);
            activeTestIntervals.delete(testId);
        }
        // Delete the network test and related responses
        yield Promise.all([
            networkTest_1.default.deleteOne({ _id: testId }),
            networkTestResponse_1.default.deleteMany({ networkTest: testId }),
        ]);
        res.send("Network test deleted");
    }
    catch (error) {
        console.error("Delete network test error:", error);
        res.status(500).send("Internal server error");
    }
});
exports.deleteNetworkTest = deleteNetworkTest;
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
// export const endNetworkTestForAdmin = async (req: Request, res: Response) => {
//   try {
//     const networkTest = await NetworkTestModel.findById(req.query.id);
//     if (!networkTest) {
//       return res.status(400).send("Test not found");
//     }
//     const [
//       totalComputers,
//       //  networkTest,
//       connected,
//       computersWithNetworkLosses,
//       totalNetworkLosses,
//       ended,
//       disconnected,
//       totalResponses,
//     ] = await Promise.all([
//       NetworkTestResponseModel.countDocuments({
//         networkTest: req.query.id,
//       }),
//       // NetworkTestModel.findById(req.query.id),
//       NetworkTestResponseModel.countDocuments({
//         networkTest: req.query.id,
//         status: "connected",
//       }),
//       NetworkTestResponseModel.countDocuments({
//         networkTest: req.query.id,
//         networkLosses: { $gt: 0 },
//       }),
//       NetworkTestResponseModel.aggregate([
//         {
//           $match: {
//             networkTest: new mongoose.Types.ObjectId(req.query.id?.toString()),
//           },
//         },
//         {
//           $group: {
//             _id: null,
//             total: { $sum: "$networkLosses" },
//           },
//         },
//       ]),
//       NetworkTestResponseModel.countDocuments({
//         networkTest: req.query.id,
//         status: "ended",
//       }),
//       NetworkTestResponseModel.countDocuments({
//         networkTest: req.query.id,
//         status: "disconnected",
//       }),
//       NetworkTestResponseModel.aggregate([
//         {
//           $match: {
//             networkTest: new mongoose.Types.ObjectId(req.query.id?.toString()),
//           },
//         },
//         {
//           $group: {
//             _id: null,
//             total: { $sum: "$responses" },
//           },
//         },
//       ]),
//     ]);
//     await NetworkTestModel.updateOne(
//       { _id: req.query.id },
//       {
//         $set: {
//           active: false,
//           ended: true,
//           timeEnded: new Date(),
//           totalNetworkLosses: totalNetworkLosses[0]?.total || 0,
//           computersWithNetworkLosses: computersWithNetworkLosses,
//           connectedComputers: totalComputers,
//           endedComputers: ended,
//           lostInTransport: disconnected + connected,
//           responseThroughput: (
//             ((totalResponses[0]?.total || 0) /
//               ((totalComputers * networkTest?.duration) / 1000 / 60)) *
//             100
//           ).toFixed(2),
//         },
//       }
//     );
//     res.send("Test ended successfully");
//   } catch (error) {
//     res.status(500).send("Server error");
//   }
// };
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

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
exports.networkTestDashboard = exports.deleteNetworkTest = exports.viewMyComputerResponse = exports.endNetworkTest = exports.sendResponses = exports.computerListUnderNetworkTest = exports.beginNetworkTest = exports.networkTestValidation = exports.viewNetworkTest = exports.toggleActivation = exports.viewNetworkTests = exports.createNetworkTest = void 0;
const uuid_1 = require("uuid");
const networkTest_1 = __importDefault(require("../models/networkTest"));
const computerModel_1 = __importDefault(require("../models/computerModel"));
const centreModel_1 = __importDefault(require("../models/centreModel"));
const DataQueue_1 = require("./DataQueue");
const networkTestResponse_1 = __importDefault(require("../models/networkTestResponse"));
const mongoose_1 = __importDefault(require("mongoose"));
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
const toggleActivation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const test = yield networkTest_1.default.findOne({ _id: req.query.id });
    yield networkTest_1.default.updateMany({ active: true }, { active: false });
    if (!test) {
        return res.status(400).send("Test not found");
    }
    test.active = !test.active;
    yield test.save();
    res.send("Success");
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
    const centre = yield centreModel_1.default.findOne();
    if (!centre) {
        return res.status(400).send(errorMessages.noCentre);
    }
    const computer = yield computerModel_1.default.findOne({
        serialNumber: req.body.serialNumber,
        macAddresses: req.body.macAddress,
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
    const computerList = yield networkTestResponse_1.default.find({
        networkTest: req.params.id,
    })
        .populate("computer")
        .lean();
    checkLastActive(req.params.id);
    const mappedComputerList = computerList.map((computer, i) => {
        return Object.assign(Object.assign({}, computer), { id: i + 1 });
    });
    res.send(mappedComputerList);
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
            response.responses += 1;
            response.timeLeft = timeLeft;
            response.status = "connected";
            yield response.save();
            checkLastActive(networktest);
            res.send("Success");
        }));
    }
    catch (error) {
        console.error("Error in sendResponses:", error);
        res.status(500).send({ message: "Server error" });
    }
});
exports.sendResponses = sendResponses;
const endNetworkTest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
const deleteNetworkTest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield Promise.all([
        networkTest_1.default.deleteOne({ _id: req.query.id }),
        networkTestResponse_1.default.deleteMany({ networkTest: req.query.id }),
    ]);
    res.send("Network test deleted");
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

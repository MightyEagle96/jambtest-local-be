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
exports.viewMyComputerResponse = exports.endNetworkTest = exports.questionAndResponseCount = exports.sendResponses = exports.beginNetworkTest = exports.networkTestValidation = exports.viewNetworkTest = void 0;
const uuid_1 = require("uuid");
const networkTest_1 = __importDefault(require("../models/networkTest"));
const computerModel_1 = __importDefault(require("../models/computerModel"));
const centreModel_1 = __importDefault(require("../models/centreModel"));
const DataQueue_1 = require("./DataQueue");
const networkTestResponse_1 = __importDefault(require("../models/networkTestResponse"));
const questions_1 = __importDefault(require("./questions"));
const activeTestIntervals = new Map();
const id = (0, uuid_1.v4)();
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
const responseQueue = new DataQueue_1.ConcurrentJobQueue({
    concurrency: 1,
    maxQueueSize: 100,
    retries: 0,
    retryDelay: 3000,
    shutdownTimeout: 30000,
});
const sendResponses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const activeTest = yield networkTest_1.default.findOne({ active: true });
        if (!activeTest) {
            return res.sendStatus(404);
        }
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

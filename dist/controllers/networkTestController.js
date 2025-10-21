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
exports.viewNetworkTest = exports.toggleActivation = exports.viewNetworkTests = exports.createNetworkTest = void 0;
const uuid_1 = require("uuid");
const networkTest_1 = __importDefault(require("../models/networkTest"));
const computerModel_1 = __importDefault(require("../models/computerModel"));
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

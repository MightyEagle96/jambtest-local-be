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
exports.deleteComputer = exports.getComputers = exports.fetchInfractionReports = exports.deleteComputers = exports.uploadComputers = exports.viewRegisteredComputers = exports.registerComputer = void 0;
const computerModel_1 = __importDefault(require("../models/computerModel"));
const centreModel_1 = __importDefault(require("../models/centreModel"));
const httpService_1 = require("../httpService");
const registerComputer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const centre = yield centreModel_1.default.findOne();
    if (!centre) {
        return res.status(400).send("Centre not found");
    }
    const body = req.body;
    const existingComputer = yield computerModel_1.default.findOne({
        serialNumber: body.serialNumber,
    });
    if (existingComputer) {
        return res.status(400).send("Computer already registered");
    }
    body.centre = centre._id;
    yield computerModel_1.default.create(body);
    res.send("Success");
});
exports.registerComputer = registerComputer;
const viewRegisteredComputers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = (req.query.page || 1);
    const limit = (req.query.limit || 50);
    const computers = yield computerModel_1.default.find({})
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    const [total, cleanComputers, infractions, uploaded, notUploaded] = yield Promise.all([
        computerModel_1.default.countDocuments(),
        computerModel_1.default.countDocuments({ flagged: false }),
        computerModel_1.default.countDocuments({ flagged: true }),
        computerModel_1.default.countDocuments({ status: "uploaded" }),
        computerModel_1.default.countDocuments({ status: "not uploaded" }),
    ]);
    const totalComputers = computers.map((c, i) => {
        return Object.assign(Object.assign({}, c), { id: (page - 1) * limit + i + 1 });
    });
    res.send({
        total,
        totalComputers,
        cleanComputers,
        infractions,
        uploaded,
        notUploaded,
    });
});
exports.viewRegisteredComputers = viewRegisteredComputers;
const uploadComputers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const computers = yield computerModel_1.default.find({ status: "not uploaded" });
    const response = yield httpService_1.httpService.post("centre/uploadcomputer", {
        computers,
        centreId: (_a = req.centre) === null || _a === void 0 ? void 0 : _a._id.toString(),
    });
    res.status(response.status).send(response.data);
});
exports.uploadComputers = uploadComputers;
const deleteComputers = () => __awaiter(void 0, void 0, void 0, function* () { });
exports.deleteComputers = deleteComputers;
const fetchInfractionReports = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const response = yield httpService_1.httpService.get("centre/infractions", {
        headers: { centreid: (_a = req.centre) === null || _a === void 0 ? void 0 : _a._id.toString() },
        params: { page: req.query.page || 1, limit: req.query.limit || 50 },
    });
    res.status(response.status).send(response.data);
});
exports.fetchInfractionReports = fetchInfractionReports;
const getComputers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const response = yield httpService_1.httpService.get("centre/centrecomputers", {
        params: { centre: (_a = req.centre) === null || _a === void 0 ? void 0 : _a._id.toString() },
    });
    if (response.status === 200) {
        yield computerModel_1.default.deleteMany();
        yield computerModel_1.default.insertMany(response.data);
        res.send("New computers imported");
    }
    else
        res.status(response.status).send("Could not import new computers");
});
exports.getComputers = getComputers;
const deleteComputer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield computerModel_1.default.deleteOne({ _id: req.params.id });
    res.send("Computer deleted");
});
exports.deleteComputer = deleteComputer;

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
exports.viewComputer = exports.viewCleanedComputers = exports.deleteComputer = exports.getComputers = exports.fetchInfractionReports = exports.deleteComputers = exports.uploadComputers = exports.viewRegisteredComputers = exports.registerComputer = void 0;
const computerModel_1 = __importDefault(require("../models/computerModel"));
const centreModel_1 = __importDefault(require("../models/centreModel"));
const httpService_1 = require("../httpService");
const registerComputer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const centre = yield centreModel_1.default.findOne();
        if (!centre)
            return res.status(400).send("Centre not found");
        const body = req.body;
        // Check if all required fields are present
        if (!body.serialNumber ||
            !body.processorId ||
            !body.macAddresses ||
            body.macAddresses.length === 0)
            return res.status(400).send("Missing required fields");
        // Normalize for consistent comparison
        const serialNumber = (_a = body.serialNumber) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        const processorId = (_b = body.processorId) === null || _b === void 0 ? void 0 : _b.toLowerCase();
        const macAddresses = (body.macAddresses || []).map((m) => m.toLowerCase());
        // Check if a computer already exists with matching identifiers
        const existingComputer = yield computerModel_1.default.findOne({
            $and: [
                { serialNumber },
                { processorId },
                { macAddresses: { $in: macAddresses } },
            ],
        });
        if (existingComputer) {
            let conflictFields = [];
            if (existingComputer.serialNumber === serialNumber)
                conflictFields.push("serial number");
            if (existingComputer.processorId === processorId)
                conflictFields.push("processor ID");
            if (existingComputer.macAddresses.some((mac) => macAddresses.includes(mac)))
                conflictFields.push("MAC address");
            return res
                .status(400)
                .send(`Computer already registered — duplicate ${conflictFields.join(", ")}.`);
        }
        // Save new computer
        const newComputer = new computerModel_1.default(Object.assign(Object.assign({}, body), { serialNumber,
            processorId,
            macAddresses, centre: centre._id }));
        yield newComputer.save();
        res.send("Computer registered successfully");
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
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
    try {
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
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});
exports.getComputers = getComputers;
const deleteComputer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield computerModel_1.default.deleteOne({ _id: req.params.id });
    res.send("Computer deleted");
});
exports.deleteComputer = deleteComputer;
const viewCleanedComputers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const computers = yield computerModel_1.default.find({ flagged: false }).lean();
    res.send(computers);
});
exports.viewCleanedComputers = viewCleanedComputers;
const viewComputer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const computer = yield computerModel_1.default.findById(req.params.id).lean();
    const ip = req.ip;
    res.send(Object.assign(Object.assign({}, computer), { ip }));
});
exports.viewComputer = viewComputer;

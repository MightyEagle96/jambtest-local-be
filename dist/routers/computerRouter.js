"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computerRouter = void 0;
const express_1 = require("express");
const registrationController_1 = require("../controllers/registrationController");
const jwtController_1 = require("../controllers/jwtController");
const computerRouter = (0, express_1.Router)();
exports.computerRouter = computerRouter;
computerRouter
    .post("/register", registrationController_1.registerComputer)
    .get("/view", registrationController_1.viewRegisteredComputers)
    .post("/uploadcomputer", jwtController_1.authenticateToken, registrationController_1.uploadComputers)
    .get("/infractionreports", jwtController_1.authenticateToken, registrationController_1.fetchInfractionReports)
    .get("/getcomputers", jwtController_1.authenticateToken, registrationController_1.getComputers)
    .delete("/delete/:id", registrationController_1.deleteComputer)
    .get("/cleanedcomputers", registrationController_1.viewCleanedComputers);

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.networkTestRouter = void 0;
const express_1 = require("express");
const networkTestController_1 = require("../controllers/networkTestController");
const networkTestControllerAdmin_1 = require("../controllers/networkTestControllerAdmin");
const jwtController_1 = require("../controllers/jwtController");
const networkTestRouter = (0, express_1.Router)();
exports.networkTestRouter = networkTestRouter;
networkTestRouter
    .use(jwtController_1.authenticateToken)
    .post("/create", networkTestControllerAdmin_1.createNetworkTest)
    .get("/view", networkTestControllerAdmin_1.viewNetworkTests)
    .get("/toggleactivation", networkTestController_1.toggleActivation)
    .get("/view/:id", networkTestController_1.viewNetworkTest)
    .post("/begintest", networkTestController_1.networkTestValidation, networkTestController_1.beginNetworkTest)
    .get("/computerlist/:id", networkTestController_1.computerListUnderNetworkTest)
    .get("/dashboard", networkTestController_1.networkTestDashboard)
    .post("/sendresponses", networkTestController_1.sendResponses)
    .post("/questionandresponsecount", networkTestController_1.questionAndResponseCount)
    .post("/endnetworktest", networkTestController_1.endNetworkTest)
    .get("/myresponse", networkTestController_1.viewMyComputerResponse)
    .get("/delete", networkTestController_1.deleteNetworkTest)
    .get("/endnetworktestadmin", networkTestController_1.endNetworkTestForAdmin);

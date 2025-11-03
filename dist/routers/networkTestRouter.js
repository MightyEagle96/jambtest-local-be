"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.networkTestRouter = void 0;
const express_1 = require("express");
const networkTestControllerClient_1 = require("../controllers/networkTestControllerClient");
const networkTestControllerAdmin_1 = require("../controllers/networkTestControllerAdmin");
const jwtController_1 = require("../controllers/jwtController");
const networkTestRouter = (0, express_1.Router)();
exports.networkTestRouter = networkTestRouter;
networkTestRouter
    .use(jwtController_1.authenticateToken)
    .post("/create", networkTestControllerAdmin_1.createNetworkTest)
    .get("/view", networkTestControllerAdmin_1.viewNetworkTests)
    .delete("/delete", networkTestControllerAdmin_1.deleteNetworkTest)
    .get("/toggleactivation", networkTestControllerAdmin_1.toggleActivation)
    .get("/view/:id", networkTestControllerClient_1.viewNetworkTest)
    .post("/begintest", networkTestControllerClient_1.networkTestValidation, networkTestControllerClient_1.beginNetworkTest)
    .get("/computerlist/:id", networkTestControllerAdmin_1.computerListUnderNetworkTest)
    .get("/dashboard", networkTestControllerAdmin_1.networkTestDashboard)
    .post("/sendresponses", networkTestControllerClient_1.sendResponses)
    .post("/questionandresponsecount", networkTestControllerClient_1.questionAndResponseCount)
    .post("/endnetworktest", networkTestControllerClient_1.endNetworkTest)
    .get("/myresponse", networkTestControllerClient_1.viewMyComputerResponse)
    .get("/delete", networkTestControllerAdmin_1.deleteNetworkTest)
    .get("/endnetworktestadmin", networkTestControllerAdmin_1.endNetworkTestForAdmin);

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.networkTestRouter = void 0;
const express_1 = require("express");
const networkTestControllerClient_1 = require("../controllers/networkTestControllerClient");
const networkTestControllerAdmin_1 = require("../controllers/networkTestControllerAdmin");
const jwtController_1 = require("../controllers/jwtController");
const centreAccountController_1 = require("../controllers/centreAccountController");
const networkTestRouter = (0, express_1.Router)();
exports.networkTestRouter = networkTestRouter;
networkTestRouter
    .get("/toggleactivation", networkTestControllerAdmin_1.toggleActivation)
    .get("/view/:id", networkTestControllerClient_1.viewNetworkTest)
    .post("/begintest", networkTestControllerClient_1.networkTestValidation, networkTestControllerClient_1.beginNetworkTest)
    .get("/computerlist/:id", networkTestControllerAdmin_1.computerListUnderNetworkTest)
    .get("/dashboard", networkTestControllerAdmin_1.networkTestDashboard)
    //get the centre's detail
    .get("/centredetail", centreAccountController_1.centreDetail)
    .post("/sendresponses", networkTestControllerClient_1.sendResponses)
    .get("/ping", networkTestControllerAdmin_1.networkPing)
    .post("/questionandresponsecount", networkTestControllerClient_1.questionAndResponseCount)
    .post("/endnetworktest", networkTestControllerClient_1.endNetworkTest)
    .get("/myresponse", networkTestControllerClient_1.viewMyComputerResponse)
    .get("/delete", networkTestControllerAdmin_1.deleteNetworkTest)
    .get("/endnetworktestadmin", networkTestControllerAdmin_1.endNetworkTestForAdmin)
    .use(jwtController_1.authenticateToken)
    .post("/create", networkTestControllerAdmin_1.createNetworkTest)
    .get("/testsummary", networkTestControllerAdmin_1.retrieveNetworkTestSummary)
    .get("/view", networkTestControllerAdmin_1.viewNetworkTests)
    .delete("/delete", networkTestControllerAdmin_1.deleteNetworkTest)
    .get("/upload", networkTestControllerAdmin_1.uploadNetworkTest);

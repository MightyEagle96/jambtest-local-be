"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.networkTestRouter = void 0;
const express_1 = require("express");
const networkTestController_1 = require("../controllers/networkTestController");
const networkTestRouter = (0, express_1.Router)();
exports.networkTestRouter = networkTestRouter;
networkTestRouter
    .post("/create", networkTestController_1.createNetworkTest)
    .get("/view", networkTestController_1.viewNetworkTests)
    .get("/toggleactivation", networkTestController_1.toggleActivation)
    .get("/view/:id", networkTestController_1.viewNetworkTest)
    .post("/begintest", networkTestController_1.networkTestValidation, networkTestController_1.beginNetworkTest)
    .get("/computerlist/:id", networkTestController_1.computerListUnderNetworkTest)
    .post("/sendresponses", networkTestController_1.sendResponses)
    .get("/myresponse", networkTestController_1.viewMyComputerResponse)
    .get("/delete", networkTestController_1.deleteNetworkTest);

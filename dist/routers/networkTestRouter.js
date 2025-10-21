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
    .get("/toggleactivation", networkTestController_1.toggleActivation);

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const centreAccountController_1 = require("../controllers/centreAccountController");
const jwtController_1 = require("../controllers/jwtController");
const authRouter = (0, express_1.Router)();
exports.authRouter = authRouter;
authRouter
    .post("/login", centreAccountController_1.loginAccount)
    .get("/profile", jwtController_1.authenticateToken, centreAccountController_1.centreProfile)
    .get("/logout", centreAccountController_1.logoutAccount)
    .get("/dashboard", jwtController_1.authenticateToken, centreAccountController_1.centreDashboard)
    .get("/refresh", centreAccountController_1.getRefreshToken);

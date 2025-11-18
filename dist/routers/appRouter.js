"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("./auth");
const computerRouter_1 = require("./computerRouter");
const networkTestRouter_1 = require("./networkTestRouter");
const appRouter = (0, express_1.Router)();
appRouter
    .use("/auth", auth_1.authRouter)
    .use("/computer", computerRouter_1.computerRouter)
    .use("/networktest", networkTestRouter_1.networkTestRouter);
exports.default = appRouter;

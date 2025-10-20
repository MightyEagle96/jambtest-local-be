"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("./auth");
const computerRouter_1 = require("./computerRouter");
const appRouter = (0, express_1.Router)();
appRouter.use("/auth", auth_1.authRouter).use("/computer", computerRouter_1.computerRouter);
//.get("/", (req, res) => res.send("Hello World!"));
exports.default = appRouter;

import { Router } from "express";
import { authRouter } from "./auth";
import { computerRouter } from "./computerRouter";

const appRouter = Router();

appRouter.use("/auth", authRouter).use("/computer", computerRouter);

export default appRouter;

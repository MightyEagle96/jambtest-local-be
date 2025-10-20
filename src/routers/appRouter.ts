import { Router } from "express";
import { authRouter } from "./auth";
import { computerRouter } from "./computerRouter";
import { networkTestRouter } from "./networkTestRouter";

const appRouter = Router();

appRouter
  .use("/auth", authRouter)
  .use("/computer", computerRouter)
  .use("/networktest", networkTestRouter);

export default appRouter;

import { Router } from "express";
import { authRouter } from "./auth";
import { computerRouter } from "./computerRouter";

const appRouter = Router();

appRouter.use("/auth", authRouter).use("/computer", computerRouter);
//.get("/", (req, res) => res.send("Hello World!"));

export default appRouter;

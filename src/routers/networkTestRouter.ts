import { Router } from "express";
import {
  createNetworkTest,
  viewNetworkTests,
} from "../controllers/networkTestController";

const networkTestRouter = Router();

networkTestRouter
  .post("/create", createNetworkTest)
  .get("/view", viewNetworkTests);

export { networkTestRouter };

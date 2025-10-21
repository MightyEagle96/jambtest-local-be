import { Router } from "express";
import {
  createNetworkTest,
  toggleActivation,
  viewNetworkTests,
} from "../controllers/networkTestController";

const networkTestRouter = Router();

networkTestRouter
  .post("/create", createNetworkTest)
  .get("/view", viewNetworkTests)
  .get("/toggleactivation", toggleActivation);

export { networkTestRouter };

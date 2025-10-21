import { Router } from "express";
import {
  createNetworkTest,
  toggleActivation,
  viewNetworkTest,
  viewNetworkTests,
} from "../controllers/networkTestController";

const networkTestRouter = Router();

networkTestRouter
  .post("/create", createNetworkTest)
  .get("/view", viewNetworkTests)
  .get("/toggleactivation", toggleActivation)
  .get("/view/:id", viewNetworkTest);

export { networkTestRouter };

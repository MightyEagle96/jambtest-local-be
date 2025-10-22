import { Router } from "express";
import {
  beginNetworkTest,
  computerListUnderNetworkTest,
  createNetworkTest,
  networkTestValidation,
  toggleActivation,
  viewNetworkTest,
  viewNetworkTests,
} from "../controllers/networkTestController";

const networkTestRouter = Router();

networkTestRouter
  .post("/create", createNetworkTest)
  .get("/view", viewNetworkTests)
  .get("/toggleactivation", toggleActivation)
  .get("/view/:id", viewNetworkTest)
  .post("/begintest", networkTestValidation, beginNetworkTest)
  .get("/computerlist/:id", computerListUnderNetworkTest);

export { networkTestRouter };

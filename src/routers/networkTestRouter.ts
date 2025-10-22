import { Router } from "express";
import {
  beginNetworkTest,
  computerListUnderNetworkTest,
  createNetworkTest,
  deleteNetworkTest,
  endNetworkTest,
  networkTestValidation,
  sendResponses,
  toggleActivation,
  viewMyComputerResponse,
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
  .get("/computerlist/:id", computerListUnderNetworkTest)
  .post("/sendresponses", sendResponses)
  .post("/endnetworktest", endNetworkTest)
  .get("/myresponse", viewMyComputerResponse)
  .get("/delete", deleteNetworkTest);

export { networkTestRouter };

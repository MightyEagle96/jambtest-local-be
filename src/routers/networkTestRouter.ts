import { Router } from "express";
import {
  beginNetworkTest,
  computerListUnderNetworkTest,
  createNetworkTest,
  deleteNetworkTest,
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
  .get("/myresponse", viewMyComputerResponse)
  .get("/delete", deleteNetworkTest);

export { networkTestRouter };

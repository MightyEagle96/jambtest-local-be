import { Router } from "express";
import {
  beginNetworkTest,
  computerListUnderNetworkTest,
  // createNetworkTest,
  deleteNetworkTest,
  endNetworkTest,
  endNetworkTestForAdmin,
  networkTestDashboard,
  networkTestValidation,
  questionAndResponseCount,
  sendResponses,
  toggleActivation,
  viewMyComputerResponse,
  viewNetworkTest,
} from "../controllers/networkTestController";
import {
  createNetworkTest,
  viewNetworkTests,
} from "../controllers/networkTestControllerAdmin";
import { authenticateToken } from "../controllers/jwtController";

const networkTestRouter = Router();

networkTestRouter

  .use(authenticateToken)
  .post("/create", createNetworkTest)
  .get("/view", viewNetworkTests)
  .get("/toggleactivation", toggleActivation)
  .get("/view/:id", viewNetworkTest)
  .post("/begintest", networkTestValidation, beginNetworkTest)
  .get("/computerlist/:id", computerListUnderNetworkTest)
  .get("/dashboard", networkTestDashboard)

  .post("/sendresponses", sendResponses)
  .post("/questionandresponsecount", questionAndResponseCount)
  .post("/endnetworktest", endNetworkTest)
  .get("/myresponse", viewMyComputerResponse)
  .get("/delete", deleteNetworkTest)
  .get("/endnetworktestadmin", endNetworkTestForAdmin);

export { networkTestRouter };

import { Router } from "express";
import {
  beginNetworkTest,
  //computerListUnderNetworkTest,
  // createNetworkTest,
  // deleteNetworkTest,
  endNetworkTest,
  // endNetworkTestForAdmin,
  // networkTestDashboard,
  networkTestValidation,
  questionAndResponseCount,
  sendResponses,
  viewMyComputerResponse,
  viewNetworkTest,
} from "../controllers/networkTestControllerClient";
import {
  createNetworkTest,
  viewNetworkTests,
  deleteNetworkTest,
  computerListUnderNetworkTest,
  networkTestDashboard,
  endNetworkTestForAdmin,
  toggleActivation,
} from "../controllers/networkTestControllerAdmin";
import { authenticateToken } from "../controllers/jwtController";

const networkTestRouter = Router();

networkTestRouter

  .use(authenticateToken)
  .post("/create", createNetworkTest)
  .get("/view", viewNetworkTests)
  .delete("/delete", deleteNetworkTest)

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

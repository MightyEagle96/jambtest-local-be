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
  uploadNetworkTest,
  networkPing,
} from "../controllers/networkTestControllerAdmin";
import { authenticateToken } from "../controllers/jwtController";
import { centreDetail } from "../controllers/centreAccountController";

const networkTestRouter = Router();

networkTestRouter

  .get("/toggleactivation", toggleActivation)
  .get("/view/:id", viewNetworkTest)
  .post("/begintest", networkTestValidation, beginNetworkTest)
  .get("/computerlist/:id", computerListUnderNetworkTest)
  .get("/dashboard", networkTestDashboard)

  //get the centre's detail
  .get("/centredetail", centreDetail)

  .post("/sendresponses", sendResponses)
  .get("/ping", networkPing)
  .post("/questionandresponsecount", questionAndResponseCount)
  .post("/endnetworktest", endNetworkTest)
  .get("/myresponse", viewMyComputerResponse)
  .get("/delete", deleteNetworkTest)
  .get("/endnetworktestadmin", endNetworkTestForAdmin)

  .use(authenticateToken)
  .post("/create", createNetworkTest)
  .get("/view", viewNetworkTests)
  .delete("/delete", deleteNetworkTest)
  .get("/upload", uploadNetworkTest);

export { networkTestRouter };

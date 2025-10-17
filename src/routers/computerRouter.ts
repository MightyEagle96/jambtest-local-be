import { Router } from "express";
import {
  fetchInfractionReports,
  registerComputer,
  uploadComputers,
  viewRegisteredComputers,
} from "../controllers/registrationController";
import { authenticateToken } from "../controllers/jwtController";

const computerRouter = Router();

computerRouter
  .post("/register", registerComputer)
  .get("/view", viewRegisteredComputers)
  .post("/uploadcomputer", authenticateToken, uploadComputers)
  .get("/infractionreports", authenticateToken, fetchInfractionReports);

export { computerRouter };

import { Router } from "express";
import {
  deleteComputer,
  fetchInfractionReports,
  getComputers,
  registerComputer,
  uploadComputers,
  viewCleanedComputers,
  viewComputer,
  viewRegisteredComputers,
} from "../controllers/registrationController";
import { authenticateToken } from "../controllers/jwtController";

const computerRouter = Router();

computerRouter
  .post("/register", registerComputer)
  .get("/view", viewRegisteredComputers)
  .post("/uploadcomputer", authenticateToken, uploadComputers)
  .get("/infractionreports", authenticateToken, fetchInfractionReports)
  .get("/getcomputers", authenticateToken, getComputers)
  .delete("/delete/:id", deleteComputer)
  .get("/cleanedcomputers", viewCleanedComputers)
  .get("/viewcomputer/:id", viewComputer);

export { computerRouter };

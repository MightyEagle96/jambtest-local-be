import { Router } from "express";
import {
  registerComputer,
  viewRegisteredComputers,
} from "../controllers/registrationController";

const computerRouter = Router();

computerRouter
  .post("/register", registerComputer)
  .get("/view", viewRegisteredComputers);

export { computerRouter };

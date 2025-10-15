import { Router } from "express";
import {
  centreProfile,
  getRefreshToken,
  loginAccount,
  logoutAccount,
} from "../controllers/centreAccountController";
import { authenticateToken } from "../controllers/jwtController";

const authRouter = Router();

authRouter
  .post("/login", loginAccount)
  .get("/profile", authenticateToken, centreProfile)
  .get("/logout", logoutAccount)
  .get("/refresh", getRefreshToken);

export { authRouter };

import { Router } from "express";
import {
  centreDashboard,
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
  .get("/dashboard", authenticateToken, centreDashboard)
  .get("/refresh", getRefreshToken);

export { authRouter };

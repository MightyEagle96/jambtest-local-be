import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import { AuthenticatedCentre, ICentre } from "../models/centreModel";

dotenv.config();

export const tokens = {
  accessToken: "accessToken",
  refreshToken: "refreshToken",
};

export const generateAccessToken = (payload: JwtPayload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN!, {
    expiresIn: "1d",
  });
};

export const generateRefreshToken = (payload: JwtPayload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN!, {
    expiresIn: "7d",
  });
};

export const authenticateToken = (
  req: AuthenticatedCentre,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.sendStatus(401);
  }

  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN!) as JwtPayload &
    ICentre;

  if (decoded) {
    req.centre = decoded;
  }

  next();
};

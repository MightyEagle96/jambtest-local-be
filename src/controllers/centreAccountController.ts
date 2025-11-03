import { Request, Response } from "express";
import { httpService } from "../httpService";
import CentreModel, { AuthenticatedCentre } from "../models/centreModel";
import {
  generateAccessToken,
  generateRefreshToken,
  tokens,
} from "./jwtController";
import jwt from "jsonwebtoken";
import ComputerModel from "../models/computerModel";
import NetworkTestModel from "../models/networkTest";

import mongoose from "mongoose";

export const loginAccount = async (req: Request, res: Response) => {
  try {
    const response = await httpService.post("centre/login", req.body);

    if (response.status !== 200)
      return res
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .status(response.status)
        .send(response.data);

    const { centre, computers, networkTests } = response.data;

    // Defensive check
    if (!centre || !computers || !networkTests)
      return res.status(400).send("Incomplete response data");

    // ✅ Clear old data first
    await Promise.all([
      CentreModel.deleteMany(),
      ComputerModel.deleteMany(),
      NetworkTestModel.deleteMany(),
    ]);

    // ✅ Insert new data
    await CentreModel.create(centre);
    await ComputerModel.insertMany(computers);
    await NetworkTestModel.insertMany(networkTests);

    // ✅ Issue tokens
    const accessToken = generateAccessToken({ ...centre, role: "admin" });
    const refreshToken = generateRefreshToken({ ...centre, role: "admin" });

    res
      .cookie("accessToken", accessToken, {
        httpOnly: false,
        secure: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24,
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: false,
        secure: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      })
      .send("Success");
  } catch (error: any) {
    console.error("Login error:", error.message);
    res.status(500).send("Something went wrong");
  }
};

export const logoutAccount = async (req: Request, res: Response) => {
  await Promise.all([CentreModel.deleteMany(), ComputerModel.deleteMany()]);

  res.clearCookie("accessToken").clearCookie("refreshToken").send("Success");
};

export const centreProfile = async (
  req: AuthenticatedCentre,
  res: Response
) => {
  res.send(req.centre);
};

export const getRefreshToken = async (
  req: AuthenticatedCentre,
  res: Response
) => {
  const refreshToken = req.cookies[tokens.refreshToken];

  if (!refreshToken) {
    return res.sendStatus(401);
  }

  try {
    const decoded: any = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN as string
    );

    const centre = await CentreModel.findById(decoded._id).lean();

    if (!centre) {
      return res.sendStatus(401);
    }

    const newAccessToken = generateAccessToken({ ...centre, role: "admin" });

    const newRefreshToken = generateRefreshToken({ ...centre, role: "admin" });

    res
      .cookie("accessToken", newAccessToken, {
        httpOnly: false,
        secure: true,
        sameSite: "none", // for cross-site cookies (frontend <-> backend on diff domains)
        maxAge: 1000 * 60 * 60 * 24,
      })
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: false,
        secure: true,
        sameSite: "none", // for cross-site cookies (frontend <-> backend on diff domains)
        maxAge: 1000 * 60 * 60 * 24 * 7,
      })
      .send("Success");
  } catch (error) {
    res.status(401).send("Invalid refresh token");
  }
  //  res.send(req.cookies[tokens.refresh_token]);
};

export const centreDashboard = async (
  req: AuthenticatedCentre,
  res: Response
) => {
  const response = await httpService("centre/dashboard", {
    headers: { centreid: req.centre?._id.toString() },
  });

  res.status(response.status).send(response.data);
};

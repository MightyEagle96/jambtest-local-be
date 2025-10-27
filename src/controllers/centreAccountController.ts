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

export const loginAccount = async (req: Request, res: Response) => {
  try {
    const response = await httpService.post("centre/login", req.body);

    console.log(response);
    if (response.status === 200) {
      // save to database

      await Promise.all([
        CentreModel.create(response.data.centre),
        ComputerModel.insertMany(response.data.computers),
      ]);

      const accessToken = generateAccessToken({
        ...response.data.centre,
        role: "admin",
      });
      const refreshToken = generateRefreshToken({
        ...response.data.centre,
        role: "admin",
      });
      res
        .cookie("accessToken", accessToken, {
          httpOnly: false,
          secure: true,
          sameSite: "none", // for cross-site cookies (frontend <-> backend on diff domains)
          maxAge: 1000 * 60 * 60,
        })
        .cookie("refreshToken", refreshToken, {
          httpOnly: false,
          secure: true,
          sameSite: "none", // for cross-site cookies (frontend <-> backend on diff domains)
          maxAge: 1000 * 60 * 60 * 24 * 7,
        })
        .send("Success");
    } else
      res
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .status(response.status)
        .send(response.data);
  } catch (error) {
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

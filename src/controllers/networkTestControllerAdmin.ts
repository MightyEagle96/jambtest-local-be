import { Response } from "express";
import { httpService } from "../httpService";
import { AuthenticatedCentre } from "../models/centreModel";
import NetworkTestModel from "../models/networkTest";

export const createNetworkTest = async (
  req: AuthenticatedCentre,
  res: Response
) => {
  const response = await httpService.post("networktest/create", req.body, {
    headers: { centreid: req.centre?._id.toString() },
  });

  res.status(response.status).send(response.data);
};

export const viewNetworkTests = async (
  req: AuthenticatedCentre,
  res: Response
) => {
  try {
    const response = await httpService.get("networktest/viewcentretests", {
      headers: { centreid: req.centre?._id.toString() },
    });

    if (response.status === 200) {
      for (const test of response.data) {
        await NetworkTestModel.updateOne(
          { _id: test._id }, // or testId if different
          { $set: test },
          { upsert: true }
        );
      }

      const remoteIds = response.data.map((t: any) => t._id);
      await NetworkTestModel.deleteMany({ _id: { $nin: remoteIds } });

      return res.send(response.data);
    }

    return res.status(response.status).send(response.data);
  } catch (err: any) {
    console.error("Error viewing network tests:", err.message);
    return res.status(500).send({ error: "Failed to fetch network tests" });
  }
};

import { Request, Response } from "express";
import { httpService } from "../httpService";
import CentreModel, { AuthenticatedCentre } from "../models/centreModel";
import NetworkTestModel, { INetworkTest } from "../models/networkTest";
import NetworkTestResponseModel from "../models/networkTestResponse";
import mongoose from "mongoose";
import ComputerModel from "../models/computerModel";

import { generateId } from "./generateId";
import { timeEnd } from "console";

const activeTestIntervals = new Map<string, NodeJS.Timeout>();

const checkLastActive = async (networkTest: any) => {
  // Find computers not updated in the last 1 minute
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  const staleComputers = await NetworkTestResponseModel.find({
    networkTest: networkTest,
    updatedAt: { $lt: oneMinuteAgo },
  });

  for (const c of staleComputers) {
    if (c.status === "connected") {
      c.status = "disconnected";
      c.networkLosses += 1;
      await c.save();
    }
  }
};

export const createNetworkTest = async (
  req: AuthenticatedCentre,
  res: Response
) => {
  /**
   * Check for uploaded computers
   * Check for not uploaded test
   */

  const notUploadedTest = await NetworkTestModel.findOne({
    status: { $ne: "uploaded" },
  });
  if (notUploadedTest) {
    return res.status(400).send("A test is yet to be uploaded");
  }

  const [computers, uploadedComputers] = await Promise.all([
    ComputerModel.countDocuments(),
    ComputerModel.countDocuments({ status: "uploaded" }),
  ]);

  if (uploadedComputers === 0) {
    return res.status(400).send("No computers uploaded");
  }
  if (computers !== uploadedComputers) {
    return res
      .status(400)
      .send("All computers must be uploaded before creating a test");
  }

  const examId = generateId();

  req.body.duration = Number(req.body.duration * 60 * 1000);
  req.body.centre = req.centre?._id.toString();
  req.body.examId = examId;

  await NetworkTestModel.create(req.body);

  res.send("New network test created");
};

export const viewNetworkTests = async (
  req: AuthenticatedCentre,
  res: Response
) => {
  try {
    const page = (req.query.page || 1) as number;
    const limit = (req.query.limit || 50) as number;
    const networkTests = await NetworkTestModel.find({
      centre: req.centre?._id.toString(),
    })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await NetworkTestModel.countDocuments({
      centre: req.centre?._id.toString(),
    });

    const mappedNetworkTests = networkTests.map((networkTest, i) => {
      return {
        ...networkTest,
        id: (page - 1) * limit + i + 1,
      };
    });

    res.send({ total, networkTests: mappedNetworkTests });
  } catch (error) {
    res.status(500).send("Internal server error");
  }
};

export const deleteNetworkTest = async (
  req: AuthenticatedCentre,
  res: Response
) => {
  try {
    const testId = req.query.id as string;
    const networkTest = await NetworkTestModel.findById(testId);

    if (!networkTest) {
      return res.status(404).send("Network test not found");
    }

    if (networkTest.active) {
      return res.status(400).send("Please end this test before you delete it");
    }
    // Clear the interval for this test, if it exists
    const intervalId = activeTestIntervals.get(testId);
    if (intervalId) {
      clearInterval(intervalId);
      activeTestIntervals.delete(testId);
    }

    await NetworkTestModel.findByIdAndDelete(testId);
    await NetworkTestResponseModel.deleteMany({ networkTest: testId });

    res.send("Network test deleted successfully");

    // // Delete the network test and related responses
    // const response = await httpService.delete("networktest/delete", {
    //   params: { testid: req.query.id, centre: req.centre?._id.toString() },
    // });

    // res.status(response.status).send(response.data);
  } catch (error) {
    console.error("Delete network test error:", error);
    res.status(500).send("Internal server error");
  }
};

export const toggleActivation = async (req: Request, res: Response) => {
  try {
    const testId = req.query.id as string;

    if (!testId) {
      return res.status(400).send("Invalid test ID");
    }

    const test = await NetworkTestModel.findById(testId);

    console.log(test);
    if (!test) {
      return res.status(404).send("Test not found");
    }

    // 🔴 Deactivate if active
    if (test.active) {
      if (!test.ended) {
        return res.status(400).send("Cannot deactivate — test not ended yet.");
      }

      const intervalId = activeTestIntervals.get(testId);
      if (intervalId) {
        clearInterval(intervalId);
        activeTestIntervals.delete(testId);
      }

      test.active = false;
      test.ended = true;
      test.timeEnded = new Date();
      await test.save();

      return res.send("Test deactivated successfully.");
    }

    // 🟢 Activate new test
    const ongoingTest = await NetworkTestModel.findOne({
      active: true,
      ended: false,
    });
    if (ongoingTest) {
      return res
        .status(400)
        .send("Another test is currently active and not yet ended.");
    }

    // Clear any residual interval (safety)
    if (activeTestIntervals.has(testId)) {
      clearInterval(activeTestIntervals.get(testId)!);
      activeTestIntervals.delete(testId);
    }

    await NetworkTestModel.updateOne(
      { _id: testId },
      { $set: { active: true, ended: false, timeActivated: new Date() } }
    );

    test.active = true;
    test.ended = false;
    test.timeActivated = new Date();
    await test.save();

    const intervalId = setInterval(() => {
      checkLastActive(testId);
      console.log(
        `[${new Date().toISOString()}] Background check for ${testId}`
      );
    }, 10 * 1000);

    activeTestIntervals.set(testId, intervalId);
    return res.send("Test activated successfully.");
  } catch (error) {
    console.error("Toggle activation error:", error);
    res.status(500).send("Internal server error.");
  }
};

export const endNetworkTestForAdmin = async (req: Request, res: Response) => {
  try {
    const testId = req.query.id as string;
    const networkTest = await NetworkTestModel.findById(testId);

    if (!networkTest) {
      return res.status(404).send("Test not found"); // Updated to 404 for consistency
    }

    // Clear the interval for this test, if it exists
    const intervalId = activeTestIntervals.get(testId);
    if (intervalId) {
      clearInterval(intervalId);
      activeTestIntervals.delete(testId);
    }

    const [
      totalComputers,
      connected,
      computersWithNetworkLosses,
      totalNetworkLosses,
      ended,
      disconnected,
      totalResponses,
    ] = await Promise.all([
      NetworkTestResponseModel.countDocuments({
        networkTest: testId,
      }),

      NetworkTestResponseModel.countDocuments({
        networkTest: testId,
        status: "connected",
      }),

      NetworkTestResponseModel.countDocuments({
        networkTest: testId,
        networkLosses: { $gt: 0 },
      }),

      NetworkTestResponseModel.aggregate([
        {
          $match: {
            networkTest: new mongoose.Types.ObjectId(testId),
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$networkLosses" },
          },
        },
      ]),

      NetworkTestResponseModel.countDocuments({
        networkTest: testId,
        status: "ended",
      }),

      NetworkTestResponseModel.countDocuments({
        networkTest: testId,
        status: "disconnected",
      }),

      NetworkTestResponseModel.aggregate([
        {
          $match: {
            networkTest: new mongoose.Types.ObjectId(testId),
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$responses" },
          },
        },
      ]),
    ]);

    await NetworkTestModel.updateOne(
      { _id: testId },
      {
        $set: {
          active: false,
          ended: true,
          timeEnded: new Date(),
          totalNetworkLosses: totalNetworkLosses[0]?.total || 0,
          computersWithNetworkLosses: computersWithNetworkLosses,
          connectedComputers: totalComputers,
          endedComputers: ended,
          lostInTransport: disconnected + connected,
          responseThroughput: (
            ((totalResponses[0]?.total || 0) /
              ((totalComputers * networkTest?.duration) / 1000 / 60)) *
            100
          ).toFixed(2),
        },
      }
    );

    res.send("Test ended successfully");
  } catch (error) {
    console.error("End network test error:", error);
    res.status(500).send("Server error");
  }
};

export const networkTestDashboard = async (req: Request, res: Response) => {
  try {
    const networkTest = await NetworkTestModel.findById(req.query.id);

    if (!networkTest) {
      return res.status(400).send("Test not found");
    }

    const [
      totalComputers,
      //  networkTest,
      connected,
      computersWithNetworkLosses,
      totalNetworkLosses,
      ended,
      disconnected,
      totalResponses,
    ] = await Promise.all([
      NetworkTestResponseModel.countDocuments({
        networkTest: req.query.id,
      }),

      // NetworkTestModel.findById(req.query.id),

      NetworkTestResponseModel.countDocuments({
        networkTest: req.query.id,
        status: "connected",
      }),

      NetworkTestResponseModel.countDocuments({
        networkTest: req.query.id,
        networkLosses: { $gt: 0 },
      }),

      NetworkTestResponseModel.aggregate([
        {
          $match: {
            networkTest: new mongoose.Types.ObjectId(req.query.id?.toString()),
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$networkLosses" },
          },
        },
      ]),

      NetworkTestResponseModel.countDocuments({
        networkTest: req.query.id,
        status: "ended",
      }),

      NetworkTestResponseModel.countDocuments({
        networkTest: req.query.id,
        status: "disconnected",
      }),

      NetworkTestResponseModel.aggregate([
        {
          $match: {
            networkTest: new mongoose.Types.ObjectId(req.query.id?.toString()),
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$responses" },
          },
        },
      ]),
    ]);

    res.send({
      totalComputers,
      connected,
      computersWithNetworkLosses,
      totalNetworkLosses: totalNetworkLosses[0]?.total || 0,
      ended,
      disconnected,
      totalResponses: totalResponses[0]?.total || 0,
      expected: (totalComputers * networkTest?.duration) / 1000 / 60,
      responseThroughput: (
        ((totalResponses[0]?.total || 0) /
          ((totalComputers * networkTest?.duration) / 1000 / 60)) *
        100
      ).toFixed(2),
    });
  } catch (error) {
    res.status(500).send("Server error");
  }
};

export const computerListUnderNetworkTest = async (
  req: Request,
  res: Response
) => {
  const page = (req.query.page || 1) as number;
  const limit = (req.query.limit || 50) as number;
  const computerList = await NetworkTestResponseModel.find({
    networkTest: req.params.id,
  })
    .populate("computer")
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await NetworkTestResponseModel.countDocuments({
    networkTest: req.params.id,
  });

  const mappedComputerList = computerList.map((computer, i) => {
    return {
      ...computer,
      id: (page - 1) * limit + i + 1,
    };
  });
  res.send({ total, computers: mappedComputerList });
};

export const uploadNetworkTest = async (
  req: AuthenticatedCentre,
  res: Response
) => {
  try {
    //upload the network test and the participating computers
    const testId = req.query.id;

    const networkTest = await NetworkTestModel.findById(testId);

    const responses = await NetworkTestResponseModel.find({
      networkTest: testId,
    });

    const response = await httpService.post(
      "networktest/uploadtest",
      { networkTest, responses },
      { params: { centre: req.centre?._id.toString() } }
    );

    if (response.status === 200) {
      await NetworkTestModel.updateOne(
        { _id: testId },
        { status: "uploaded", timeUploaded: new Date() }
      );
    }

    res.status(response.status).send(response.data);
  } catch (error) {
    res.status(500).send("Internal server error");
  }
};

export const networkPing = async (req: Request, res: Response) => {
  const activeTest = await NetworkTestModel.findOne({ active: true });
  if (!activeTest) {
    return res.sendStatus(404);
  }
  res.send("pong");
};

export const retrieveNetworkTestSummary = async (
  req: Request,
  res: Response
) => {
  try {
    const networkTest = await NetworkTestModel.findById(req.query.id).lean();

    if (!networkTest) {
      return res.status(400).send("Test not found");
    }

    const centre = await CentreModel.findOne({}).lean();

    if (!centre) {
      return res.status(400).send("Centre not found");
    }

    const summary = {
      testId: networkTest.examId,
      testedComputers: networkTest.connectedComputers,
      capacity: centre.CentreCapacity,
      capacityMatched: networkTest.connectedComputers >= centre.CentreCapacity,
      networkLosses: networkTest.totalNetworkLosses,
      networkLossesThreshold: networkTest.totalNetworkLosses < 45,
      duration: networkTest.duration,
      durationMatched: networkTest.duration >= 60 * 60 * 1000,
      responsesPercentage: networkTest.responseThroughput,
      responsesPercentageMatched: Number(networkTest.responseThroughput) >= 90,

      canUpload:
        networkTest.connectedComputers >= centre.CentreCapacity &&
        networkTest.totalNetworkLosses < 45 &&
        networkTest.duration >= 60 * 60 * 1000 &&
        Number(networkTest.responseThroughput) >= 90,

      datedCreated: networkTest.dateCreated,
      timeActivated: networkTest.timeActivated,
      timeEnded: networkTest.timeEnded,
      timeUploaded: networkTest.timeUploaded,
    };

    //console.log(summary);

    res.send(summary);
  } catch (error) {
    res.sendStatus(500);
  }
};

import { Request, Response } from "express";
import { httpService } from "../httpService";
import { AuthenticatedCentre } from "../models/centreModel";
import NetworkTestModel, { INetworkTest } from "../models/networkTest";
import NetworkTestResponseModel from "../models/networkTestResponse";
import mongoose from "mongoose";

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

    // if (!networkTest.ended) {
    //   return res.status(400).send("Please end this test before you delete it");
    // }

    if (networkTest.active) {
      return res.status(400).send("Please end this test before you delete it");
    }
    // Clear the interval for this test, if it exists
    const intervalId = activeTestIntervals.get(testId);
    if (intervalId) {
      clearInterval(intervalId);
      activeTestIntervals.delete(testId);
    }

    // Delete the network test and related responses
    const response = await httpService.delete("networktest/delete", {
      params: { testid: req.query.id, centre: req.centre?._id.toString() },
    });

    res.status(response.status).send(response.data);
  } catch (error) {
    console.error("Delete network test error:", error);
    res.status(500).send("Internal server error");
  }
};

export const toggleActivation = async (req: Request, res: Response) => {
  try {
    const testId = req.query.id as string;
    const test = await NetworkTestModel.findById(testId);

    if (!test) {
      return res.status(404).send("Test not found");
    }

    // If the test is currently active — deactivate it
    if (test.active) {
      if (!test.ended) {
        return res
          .status(400)
          .send("Cannot deactivate this test — it has not been ended.");
      }

      // Clear the interval for this test
      const intervalId = activeTestIntervals.get(testId);
      if (intervalId) {
        clearInterval(intervalId);
        activeTestIntervals.delete(testId);
      }

      test.active = false;
      test.timeEnded = new Date();
      test.ended = true;
      await test.save();
      return res.send("Test deactivated successfully.");
    }

    // Check for other active tests
    const ongoingTest: Partial<INetworkTest> | null =
      await NetworkTestModel.findOne({
        active: true,
        ended: false,
      });

    if (ongoingTest) {
      return res
        .status(400)
        .send("Another test is currently active and has not been ended.");
    }

    // Activate the test and start background check
    test.active = true;
    test.ended = false;
    //test.timeEnded = ;
    test.timeActivated = new Date();
    await test.save();

    // Start the interval for checkLastActive (e.g., every 10 seconds)
    const intervalId = setInterval(() => {
      checkLastActive(testId);
      console.log("Background check for test", testId);
    }, 10 * 1000); // Adjust interval as needed (10 seconds here)

    // Store the interval ID
    activeTestIntervals.set(testId, intervalId);

    res.send("Test activated successfully.");
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

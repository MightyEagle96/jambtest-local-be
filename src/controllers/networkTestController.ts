import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import NetworkTestModel from "../models/networkTest";
import ComputerModel from "../models/computerModel";
import CentreModel from "../models/centreModel";
import { ConcurrentJobQueue } from "./DataQueue";
import NetworkTestResponseModel from "../models/networkTestResponse";
import { WebSocketServer } from "ws";
import { wss } from "../app";
import mongoose from "mongoose";

const id = uuidv4();
export const createNetworkTest = async (req: Request, res: Response) => {
  const uploadedSystems = await ComputerModel.countDocuments({
    status: "uploaded",
  });

  if (uploadedSystems === 0) {
    return res.status(400).send("No uploaded systems");
  }

  await NetworkTestModel.create({
    ...req.body,
    examId: id,
    duration: req.body.duration * 60 * 1000,
  });
  res.send("Success");
};

export const viewNetworkTests = async (req: Request, res: Response) => {
  const networkTests = await NetworkTestModel.find().lean();

  const mappedTests = networkTests.map((test, i) => {
    return {
      ...test,
      duration: test.duration / 1000 / 60,
      id: i + 1,
    };
  });
  res.send(mappedTests);
};

export const toggleActivation = async (req: Request, res: Response) => {
  const test = await NetworkTestModel.findOne({ _id: req.query.id });

  await NetworkTestModel.updateMany({ active: true }, { active: false });
  if (!test) {
    return res.status(400).send("Test not found");
  }
  test.active = !test.active;
  await test.save();
  res.send("Success");
};

export const viewNetworkTest = async (req: Request, res: Response) => {
  const test = await NetworkTestModel.findById(req.params.id);
  if (!test) {
    return res.status(400).send("Test not found");
  }
  res.send(test);
};

const errorMessages = {
  noCentre: "No centre found, contact administrator",
  noComputer: "Computer not yet registered",
  noActiveTest: "There is no active network test",
  computerFlagged: "This computer has been flagged for an infraction",
  notUploaded: "This computer is not yet registered on the JAMB test network",
  alreadyTested: "This computer has already been tested",
};

export const networkTestValidation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const centre = await CentreModel.findOne();

  if (!centre) {
    return res.status(400).send(errorMessages.noCentre);
  }

  const computer = await ComputerModel.findOne({
    serialNumber: req.body.serialNumber,
    macAddresses: req.body.macAddress,
  });

  if (!computer) {
    return res.status(400).send(errorMessages.noComputer);
  }

  if (computer.status !== "uploaded") {
    return res.status(400).send(errorMessages.notUploaded);
  }

  if (computer.flagged) {
    return res.status(400).send(errorMessages.computerFlagged);
  }

  const activeTest = await NetworkTestModel.findOne({ active: true });
  if (!activeTest) {
    return res.status(400).send(errorMessages.noActiveTest);
  }

  if (activeTest) {
    const response = await NetworkTestResponseModel.findOne({
      computer: computer._id.toString(),
      networkTest: activeTest._id.toString(),
      status: "ended",
    });
    if (response) {
      return res.status(400).send(errorMessages.alreadyTested);
    }
  }
  req.headers.computer = computer._id.toString();
  req.headers.networktest = activeTest._id.toString();
  next();

  //res.send("Success");
};

const dataQueue = new ConcurrentJobQueue({
  concurrency: 1,
  maxQueueSize: 100,
  retries: 0,
  retryDelay: 3000,
  shutdownTimeout: 30000,
});
export const beginNetworkTest = async (req: Request, res: Response) => {
  res.send({
    networkTest: req.headers.networktest,
    computer: req.headers.computer,
  });

  dataQueue.enqueue(async () => {
    const networkTest = await NetworkTestModel.findById(
      req.headers.networktest
    );
    const response = await NetworkTestResponseModel.findOne({
      computer: req.headers.computer,
      networkTest: req.headers.networktest,
    });

    if (!response && networkTest) {
      await NetworkTestResponseModel.create({
        computer: req.headers.computer,
        networkTest: req.headers.networktest,
        ipAddress: req.ip,
        responses: 0,
        timeLeft: networkTest.duration,
        loggedInAt: new Date(),
      });
    }
  });
};

export const computerListUnderNetworkTest = async (
  req: Request,
  res: Response
) => {
  const computerList = await NetworkTestResponseModel.find({
    networkTest: req.params.id,
  })
    .populate("computer")
    .lean();
  checkLastActive(req.params.id);

  const mappedComputerList = computerList.map((computer, i) => {
    return {
      ...computer,
      id: i + 1,
    };
  });
  res.send(mappedComputerList);
};

const responseQueue = new ConcurrentJobQueue({
  concurrency: 1,
  maxQueueSize: 100,
  retries: 0,
  retryDelay: 3000,
  shutdownTimeout: 30000,
});

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

export const sendResponses = async (req: Request, res: Response) => {
  try {
    await responseQueue.enqueue(async () => {
      const { computer, networktest, timeLeft } = req.body;

      const networkTestData = await NetworkTestModel.findById(networktest);

      if (!networkTestData) {
        console.log("No matching test found for:", networktest);
        // Explicitly return 404 so frontend can act accordingly
        return res.status(404).send("No matching test found");
      }

      const response = await NetworkTestResponseModel.findOne({
        computer,
        networkTest: networktest,
      });

      if (!response) {
        console.log("No matching response found for:", {
          computer,
          networktest,
        });
        // Explicitly return 404 so frontend can act accordingly
        return res.status(404).send({ message: "No matching response found" });
      }

      // Update existing record

      if (response.responses + 1 <= networkTestData.maxResponses) {
        response.responses += 1;
      }

      response.timeLeft = timeLeft;
      response.status = "connected";
      await response.save();

      checkLastActive(networktest);
      res.send("Success");
    });
  } catch (error) {
    console.error("Error in sendResponses:", error);
    res.status(500).send({ message: "Server error" });
  }
};

const endQueue = new ConcurrentJobQueue({
  concurrency: 1,
  maxQueueSize: 100,
  retries: 0,
  retryDelay: 3000,
  shutdownTimeout: 30000,
});

export const endNetworkTest = async (req: Request, res: Response) => {
  endQueue.enqueue(async () => {
    const response = await NetworkTestResponseModel.findOne({
      computer: req.body.computer,
      networkTest: req.body.networktest,
    });
    if (response) {
      response.timeLeft = 0;
      response.endedAt = new Date();
      response.status = "ended";
      await response.save();
    }
  });
  res.send("Success");
};

export const viewMyComputerResponse = async (req: Request, res: Response) => {
  const response = await NetworkTestResponseModel.findOne({
    computer: req.headers.computer,
    networkTest: req.headers.networktest,
  }).populate(["networkTest", "computer"]);
  if (!response) {
    return res.status(404).send("Response not found");
  }
  res.send(response);
};

export const deleteNetworkTest = async (req: Request, res: Response) => {
  await Promise.all([
    NetworkTestModel.deleteOne({ _id: req.query.id }),
    NetworkTestResponseModel.deleteMany({ networkTest: req.query.id }),
  ]);

  res.send("Network test deleted");
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

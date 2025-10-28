import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import NetworkTestModel, { INetworkTest } from "../models/networkTest";
import ComputerModel from "../models/computerModel";
import CentreModel from "../models/centreModel";
import { ConcurrentJobQueue } from "./DataQueue";
import NetworkTestResponseModel from "../models/networkTestResponse";
import mongoose from "mongoose";
import testQuestions from "./questions";

const activeTestIntervals = new Map<string, NodeJS.Timeout>();

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

// export const toggleActivation = async (req: Request, res: Response) => {
//   try {
//     const testId = req.query.id as string;
//     const test = await NetworkTestModel.findById(testId);

//     if (!test) {
//       return res.status(404).send("Test not found");
//     }

//     // 💡 If the test is currently active — it means we’re deactivating it.
//     if (test.active) {
//       if (!test.ended) {
//         return res
//           .status(400)
//           .send("Cannot deactivate this test — it has not been ended.");
//       }

//       test.active = false;
//       await test.save();
//       return res.send("Test deactivated successfully.");
//     }

//     // 💡 If we're activating a test — check that no other active test exists that hasn’t ended.
//     const ongoingTest = await NetworkTestModel.findOne({
//       active: true,
//       ended: false,
//     });

//     if (ongoingTest) {
//       return res
//         .status(400)
//         .send("Another test is currently active and has not been ended.");
//     }

//     // ✅ Safe to activate
//     test.active = true;
//     test.timeActivated = new Date();
//     await test.save();

//     res.send("Test activated successfully.");
//   } catch (error) {
//     console.error("Toggle activation error:", error);
//     res.status(500).send("Internal server error.");
//   }
// };

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

  const body = req.body;

  // Normalize for consistent comparison
  const serialNumber = body.serialNumber?.toLowerCase();
  const processorId = body.processorId?.toLowerCase();
  const macAddresses = (body.macAddresses || []).map((m: string) =>
    m.toLowerCase()
  );

  if (!centre) {
    return res.status(400).send(errorMessages.noCentre);
  }

  const computer = await ComputerModel.findOne({
    $and: [
      { serialNumber },
      { processorId },
      { macAddresses: { $in: macAddresses } },
    ],
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

      res.send("Success");
    });
  } catch (error) {
    console.error("Error in sendResponses:", error);
    res.status(500).send({ message: "Server error" });
  }
};

export const questionAndResponseCount = async (req: Request, res: Response) => {
  const [response, networkTest] = await Promise.all([
    NetworkTestResponseModel.findOne({
      computer: req.body.computer,
      networkTest: req.body.networktest,
    }),
    NetworkTestModel.findById(req.body.networktest),
  ]);

  if (!response) {
    return res.status(404).send("Response not found");
  }

  if (!networkTest) {
    return res.status(404).send("Test not found");
  }
  function selectRandomQuestion() {
    const randomIndex = Math.floor(Math.random() * testQuestions.length);
    return testQuestions[randomIndex];
  }

  res.send({
    ...selectRandomQuestion(),
    responses: response.responses,

    maxResponses: networkTest.maxResponses,
  });
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

// export const deleteNetworkTest = async (req: Request, res: Response) => {
//   const networkTest = await NetworkTestModel.findById(req.query.id);

//   if (networkTest && !networkTest.ended) {
//     return res.status(400).send("Please end this test before you delete it");
//   }

//   await Promise.all([
//     NetworkTestModel.deleteOne({ _id: req.query.id }),
//     NetworkTestResponseModel.deleteMany({ networkTest: req.query.id }),
//   ]);

//   res.send("Network test deleted");
// };

export const deleteNetworkTest = async (req: Request, res: Response) => {
  try {
    const testId = req.query.id as string;
    const networkTest = await NetworkTestModel.findById(testId);

    if (!networkTest) {
      return res.status(404).send("Network test not found");
    }

    if (!networkTest.ended) {
      return res.status(400).send("Please end this test before you delete it");
    }

    // Clear the interval for this test, if it exists
    const intervalId = activeTestIntervals.get(testId);
    if (intervalId) {
      clearInterval(intervalId);
      activeTestIntervals.delete(testId);
    }

    // Delete the network test and related responses
    await Promise.all([
      NetworkTestModel.deleteOne({ _id: testId }),
      NetworkTestResponseModel.deleteMany({ networkTest: testId }),
    ]);

    res.send("Network test deleted");
  } catch (error) {
    console.error("Delete network test error:", error);
    res.status(500).send("Internal server error");
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

// export const endNetworkTestForAdmin = async (req: Request, res: Response) => {
//   try {
//     const networkTest = await NetworkTestModel.findById(req.query.id);

//     if (!networkTest) {
//       return res.status(400).send("Test not found");
//     }

//     const [
//       totalComputers,
//       //  networkTest,
//       connected,
//       computersWithNetworkLosses,
//       totalNetworkLosses,
//       ended,
//       disconnected,
//       totalResponses,
//     ] = await Promise.all([
//       NetworkTestResponseModel.countDocuments({
//         networkTest: req.query.id,
//       }),

//       // NetworkTestModel.findById(req.query.id),

//       NetworkTestResponseModel.countDocuments({
//         networkTest: req.query.id,
//         status: "connected",
//       }),

//       NetworkTestResponseModel.countDocuments({
//         networkTest: req.query.id,
//         networkLosses: { $gt: 0 },
//       }),

//       NetworkTestResponseModel.aggregate([
//         {
//           $match: {
//             networkTest: new mongoose.Types.ObjectId(req.query.id?.toString()),
//           },
//         },
//         {
//           $group: {
//             _id: null,
//             total: { $sum: "$networkLosses" },
//           },
//         },
//       ]),

//       NetworkTestResponseModel.countDocuments({
//         networkTest: req.query.id,
//         status: "ended",
//       }),

//       NetworkTestResponseModel.countDocuments({
//         networkTest: req.query.id,
//         status: "disconnected",
//       }),

//       NetworkTestResponseModel.aggregate([
//         {
//           $match: {
//             networkTest: new mongoose.Types.ObjectId(req.query.id?.toString()),
//           },
//         },
//         {
//           $group: {
//             _id: null,
//             total: { $sum: "$responses" },
//           },
//         },
//       ]),
//     ]);

//     await NetworkTestModel.updateOne(
//       { _id: req.query.id },
//       {
//         $set: {
//           active: false,
//           ended: true,
//           timeEnded: new Date(),
//           totalNetworkLosses: totalNetworkLosses[0]?.total || 0,
//           computersWithNetworkLosses: computersWithNetworkLosses,
//           connectedComputers: totalComputers,
//           endedComputers: ended,
//           lostInTransport: disconnected + connected,
//           responseThroughput: (
//             ((totalResponses[0]?.total || 0) /
//               ((totalComputers * networkTest?.duration) / 1000 / 60)) *
//             100
//           ).toFixed(2),
//         },
//       }
//     );

//     res.send("Test ended successfully");
//   } catch (error) {
//     res.status(500).send("Server error");
//   }
// };

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

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

const responseQueue = new ConcurrentJobQueue({
  concurrency: 1,
  maxQueueSize: 100,
  retries: 0,
  retryDelay: 3000,
  shutdownTimeout: 30000,
});

export const sendResponses = async (req: Request, res: Response) => {
  try {
    const activeTest = await NetworkTestModel.findOne({ active: true });

    if (!activeTest) {
      return res.sendStatus(404);
    }

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

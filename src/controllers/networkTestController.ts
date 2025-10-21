import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import NetworkTestModel from "../models/networkTest";
import ComputerModel from "../models/computerModel";
import CentreModel from "../models/centreModel";

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
};

export const networkTestValidation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const centre = await CentreModel.findOne();

  console.log(req.body);
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

  const activeTest = await NetworkTestModel.findOne({ active: false });
  if (activeTest) {
    return res.status(400).send(errorMessages.noActiveTest);
  }

  next();

  req.headers.computer = computer._id.toString();
  //res.send("Success");
};

export const beginNetworkTest = async (req: Request, res: Response) => {
  res.send("Success");
};

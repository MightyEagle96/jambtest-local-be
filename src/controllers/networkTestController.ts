import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import NetworkTestModel from "../models/networkTest";
import ComputerModel from "../models/computerModel";

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

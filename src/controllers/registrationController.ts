import { Request, Response } from "express";
import ComputerModel, { IComputer } from "../models/computerModel";
import CentreModel, { AuthenticatedCentre } from "../models/centreModel";
import { httpService } from "../httpService";

export const registerComputer = async (req: Request, res: Response) => {
  const centre = await CentreModel.findOne();

  if (!centre) {
    return res.status(400).send("Centre not found");
  }
  const body: IComputer = req.body;

  const existingComputer = await ComputerModel.findOne({
    serialNumber: body.serialNumber,
  });

  if (existingComputer) {
    return res.status(400).send("Computer already registered");
  }

  body.centre = centre._id;

  await ComputerModel.create(body);

  res.send("Success");
};

export const viewRegisteredComputers = async (req: Request, res: Response) => {
  const page = (req.query.page || 1) as number;
  const limit = (req.query.limit || 50) as number;
  const computers = await ComputerModel.find({})
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await ComputerModel.countDocuments({});

  const totalComputers = computers.map((c, i) => {
    return {
      ...c,
      id: (page - 1) * limit + i + 1,
    };
  });

  res.send({ total, totalComputers });
};

export const uploadComputers = async (
  req: AuthenticatedCentre,
  res: Response
) => {
  const computers = await ComputerModel.find();

  const response = await httpService.post("centre/uploadcomputer", {
    computers,
    centreId: req.centre?._id.toString(),
  });

  // if (response.status !== 200)
  //   return res.status(response.status).send(response.data);

  // res.send("Success");
  res.status(response.status).send(response.data);
};

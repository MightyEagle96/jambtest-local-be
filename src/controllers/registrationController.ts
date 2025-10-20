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

  const [total, cleanComputers, infractions, uploaded, notUploaded] =
    await Promise.all([
      ComputerModel.countDocuments(),
      ComputerModel.countDocuments({ flagged: false }),
      ComputerModel.countDocuments({ flagged: true }),
      ComputerModel.countDocuments({ status: "uploaded" }),
      ComputerModel.countDocuments({ status: "not uploaded" }),
    ]);

  const totalComputers = computers.map((c, i) => {
    return {
      ...c,
      id: (page - 1) * limit + i + 1,
    };
  });

  res.send({
    total,
    totalComputers,
    cleanComputers,
    infractions,
    uploaded,
    notUploaded,
  });
};

export const uploadComputers = async (
  req: AuthenticatedCentre,
  res: Response
) => {
  const computers = await ComputerModel.find({ status: "not uploaded" });

  const response = await httpService.post("centre/uploadcomputer", {
    computers,
    centreId: req.centre?._id.toString(),
  });

  res.status(response.status).send(response.data);
};

export const deleteComputers = async () => {};

export const fetchInfractionReports = async (
  req: AuthenticatedCentre,
  res: Response
) => {
  const response = await httpService.get("centre/infractions", {
    headers: { centreid: req.centre?._id.toString() },
    params: { page: req.query.page || 1, limit: req.query.limit || 50 },
  });

  res.status(response.status).send(response.data);
};

export const getComputers = async (req: AuthenticatedCentre, res: Response) => {
  const response = await httpService.get("centre/centrecomputers", {
    params: { centre: req.centre?._id.toString() },
  });

  if (response.status === 200) {
    await ComputerModel.deleteMany();
    await ComputerModel.insertMany(response.data);

    res.send("New computers imported");
  } else res.status(response.status).send("Could not import new computers");
};

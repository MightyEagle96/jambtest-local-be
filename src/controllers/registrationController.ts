import { Request, Response } from "express";
import ComputerModel, { IComputer } from "../models/computerModel";
import CentreModel, { AuthenticatedCentre } from "../models/centreModel";
import { httpService } from "../httpService";

export const registerComputer = async (req: Request, res: Response) => {
  try {
    const centre = await CentreModel.findOne();
    if (!centre) return res.status(400).send("Centre not found");

    const body = req.body;

    // Normalize for consistent comparison
    const serialNumber = body.serialNumber?.toLowerCase();
    const processorId = body.processorId?.toLowerCase();
    const macAddresses = (body.macAddresses || []).map((m: string) =>
      m.toLowerCase()
    );

    // Check if a computer already exists with matching identifiers
    const existingComputer = await ComputerModel.findOne({
      $and: [
        { serialNumber },
        { processorId },
        { macAddresses: { $in: macAddresses } },
      ],
    });

    if (existingComputer) {
      let conflictFields: string[] = [];

      if (existingComputer.serialNumber === serialNumber)
        conflictFields.push("serial number");
      if (existingComputer.processorId === processorId)
        conflictFields.push("processor ID");
      if (
        existingComputer.macAddresses.some((mac: string) =>
          macAddresses.includes(mac)
        )
      )
        conflictFields.push("MAC address");

      return res
        .status(400)
        .send(
          `Computer already registered — duplicate ${conflictFields.join(
            ", "
          )}.`
        );
    }

    // Save new computer
    const newComputer = new ComputerModel({
      ...body,
      serialNumber,
      processorId,
      macAddresses,
      centre: centre._id,
    });

    await newComputer.save();

    res.send("Computer registered successfully");
  } catch (error: any) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
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
  try {
    const response = await httpService.get("centre/centrecomputers", {
      params: { centre: req.centre?._id.toString() },
    });

    console.log(response.data);

    if (response.status === 200) {
      await ComputerModel.deleteMany();
      await ComputerModel.insertMany(response.data);

      res.send("New computers imported");
    } else res.status(response.status).send("Could not import new computers");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
};

export const deleteComputer = async (req: Request, res: Response) => {
  await ComputerModel.deleteOne({ _id: req.params.id });
  res.send("Computer deleted");
};

export const viewCleanedComputers = async (req: Request, res: Response) => {
  const computers = await ComputerModel.find({ flagged: false }).lean();
  res.send(computers);
};

export const viewComputer = async (req: Request, res: Response) => {
  const computer = await ComputerModel.findById(req.params.id).lean();

  const ip = req.ip;

  res.send({ ...computer, ip });
};

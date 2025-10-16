import { model, Schema, Types } from "mongoose";

export interface IComputer {
  serialNumber: string;
  macAddresses: string[];
  ramMB: number;
  operatingSystem: string;
  processorId: string;
  cpuModel: string;
  model: string;
  manufacturer: string;
  centre: Types.ObjectId;
}

const schema = new Schema<IComputer>(
  {
    serialNumber: { type: String, lowercase: true },
    macAddresses: { type: [String], lowercase: true },
    ramMB: Number,
    operatingSystem: { type: String, lowercase: true },
    processorId: { type: String, lowercase: true },
    cpuModel: { type: String, lowercase: true },
    model: { type: String, lowercase: true },
    manufacturer: { type: String, lowercase: true },
    centre: { type: Schema.Types.ObjectId, ref: "Centre" },
  },
  {
    timestamps: true,
  }
);

const ComputerModel = model("Computer", schema);

export default ComputerModel;

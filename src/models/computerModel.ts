import mongoose, { Schema, Document, Types } from "mongoose";

export interface IComputer {
  serialNumber: string;
  macAddresses: string[];
  ramMB?: number;
  operatingSystem?: string;
  processorId?: string;
  cpuModel?: string;
  model?: string;
  manufacturer?: string;
  centre: Types.ObjectId;
  flagged?: boolean;
}

const computerSchema = new Schema<IComputer>(
  {
    serialNumber: { type: String, lowercase: true },
    macAddresses: { type: [String], lowercase: true },
    ramMB: Number,
    operatingSystem: { type: String, lowercase: true },
    processorId: { type: String, lowercase: true },
    cpuModel: { type: String, lowercase: true },
    model: { type: String, lowercase: true },
    manufacturer: { type: String, lowercase: true },
    centre: { type: Schema.Types.ObjectId, ref: "Centre", required: true },
    flagged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ComputerModel = mongoose.model<IComputer>("Computer", computerSchema);

export default ComputerModel;

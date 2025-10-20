import { Request } from "express";
import { Schema, Types, model } from "mongoose";

export interface INetworkTest {
  duration: number;
  examId: string;
  connectedComputers: number;
  active: boolean;
  dateCreated: Date;
}

const schema = new Schema<INetworkTest>(
  {
    duration: Number,
    examId: { type: String, lowercase: true },
    connectedComputers: { type: Number, default: 0 },
    active: { type: Boolean, default: false },
    dateCreated: { type: Date, default: new Date() },
  },
  { timestamps: true }
);

const NetworkTestModel = model("NetworkTest", schema);

export default NetworkTestModel;

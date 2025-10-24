import { Request } from "express";
import { Schema, Types, model } from "mongoose";

export interface INetworkTest {
  duration: number;
  examId: string;
  connectedComputers: number;
  active: boolean;
  dateCreated: Date;
  maxResponses: number;
}

const schema = new Schema<INetworkTest>(
  {
    duration: Number,
    examId: { type: String, lowercase: true },
    connectedComputers: { type: Number, default: 0 },
    active: { type: Boolean, default: false },
    dateCreated: { type: Date, default: new Date() },
    maxResponses: { type: Number, default: 0 },
  },
  { timestamps: true }
);

schema.pre("save", function (next) {
  this.maxResponses = this.duration / 1000 / 60;
  next();
});

const NetworkTestModel = model("NetworkTest", schema);

export default NetworkTestModel;

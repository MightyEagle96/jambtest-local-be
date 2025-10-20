import { Request } from "express";
import { Schema, Types, model } from "mongoose";

export interface INetworkTestResponse {
  networkTest: Types.ObjectId;
  computer: Types.ObjectId;
  loggedInAt: Date;
  ipAddress: string;
  responses: number;
  timeLeft: number;
}

const schema = new Schema<INetworkTestResponse>(
  {
    networkTest: {
      type: Schema.Types.ObjectId,
      ref: "NetworkTest",
      required: true,
    },
    computer: { type: Schema.Types.ObjectId, ref: "Computer", required: true },
    loggedInAt: Date,
    ipAddress: String,
    responses: Number,
    timeLeft: Number,
  },
  { timestamps: true }
);

const NetworkTestModel = model("NetworkTest", schema);

export default NetworkTestModel;

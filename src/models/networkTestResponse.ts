import { Request } from "express";
import { Schema, Types, model } from "mongoose";

export interface INetworkTestResponse {
  networkTest: Types.ObjectId;
  computer: Types.ObjectId;
  loggedInAt: Date;
  endedAt: Date;
  ipAddress: string;
  responses: number;
  timeLeft: number;
  status: "connected" | "disconnected";
  networkLosses: number;
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
    endedAt: Date,
    ipAddress: String,
    responses: Number,
    timeLeft: Number,
    status: String,
    networkLosses: Number,
  },
  { timestamps: true }
);

const NetworkTestResponseModel = model("NetworkTestResponse", schema);

export default NetworkTestResponseModel;

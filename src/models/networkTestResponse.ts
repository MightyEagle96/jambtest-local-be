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
  status: "connected" | "disconnected" | "ended";
  networkLosses: number;
  createdAt: Date;
  updatedAt: Date;
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
    responses: { type: Number, default: 0 },
    timeLeft: Number,
    status: String,
    networkLosses: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const NetworkTestResponseModel = model("NetworkTestResponse", schema);

export default NetworkTestResponseModel;

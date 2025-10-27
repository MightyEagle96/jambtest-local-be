import { Request } from "express";
import { Schema, Types, model } from "mongoose";

export interface INetworkTest {
  duration: number;
  examId: string;
  connectedComputers: number;
  active: boolean;
  dateCreated: Date;
  maxResponses: number;
  timeActivated: Date;
  timeEnded: Date;
  ended: boolean;
  totalNetworkLosses: number;
  computersWithNetworkLosses: number;
  endedComputers: number;
  lostInTransport: number;
  responseThroughput: string;
  timeUploaded: Date;
}

const schema = new Schema<INetworkTest>(
  {
    duration: Number,
    examId: { type: String, lowercase: true },
    connectedComputers: { type: Number, default: 0 },
    active: { type: Boolean, default: false },
    dateCreated: { type: Date, default: new Date() },
    maxResponses: { type: Number, default: 0 },
    timeActivated: { type: Date, default: null },
    timeEnded: { type: Date, default: null },
    ended: { type: Boolean, default: false },
    totalNetworkLosses: { type: Number, default: 0 },
    computersWithNetworkLosses: { type: Number, default: 0 },
    endedComputers: { type: Number, default: 0 },
    lostInTransport: { type: Number, default: 0 },
    responseThroughput: String,
    timeUploaded: { type: Date },
  },
  { timestamps: true }
);

schema.pre("save", function (next) {
  this.maxResponses = this.duration / 1000 / 60;
  next();
});

const NetworkTestModel = model("NetworkTest", schema);

export default NetworkTestModel;

import { Schema, Types, model } from "mongoose";

export interface INetworkTest {
  duration: number;
  examId: string;
  connectedComputers: number;
  active: boolean;
  dateCreated: Date;
  maxResponses: number;
  ended: boolean;
  totalNetworkLosses: number;
  computersWithNetworkLosses: number;
  endedComputers: number;
  lostInTransport: number;
  responseThroughput: string;
  timeActivated: Date;
  timeUploaded: Date;
  timeEnded: Date;
  centre: Types.ObjectId;

  status: "not taken" | "active" | "ended" | "uploaded";
}

const schema = new Schema<INetworkTest>(
  {
    duration: Number,
    examId: { type: String, lowercase: true },
    connectedComputers: { type: Number, default: 0 },
    active: { type: Boolean, default: false },
    dateCreated: { type: Date, default: new Date() },
    maxResponses: { type: Number, default: 0 },

    ended: { type: Boolean, default: false },
    totalNetworkLosses: { type: Number, default: 0 },
    computersWithNetworkLosses: { type: Number, default: 0 },
    endedComputers: { type: Number, default: 0 },
    lostInTransport: { type: Number, default: 0 },
    responseThroughput: String,

    centre: { type: Schema.Types.ObjectId, ref: "Centre" },
    status: { type: String, default: "not taken" },
    timeActivated: { type: Date, default: null },
    timeEnded: { type: Date, default: null },
    timeUploaded: { type: Date, default: null },
  },
  { timestamps: true }
);

schema.pre("save", function (next) {
  this.maxResponses = this.duration / 1000 / 60;
  next();
});

const NetworkTestModel = model("NetworkTest", schema);

export default NetworkTestModel;

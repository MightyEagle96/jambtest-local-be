import { Request } from "express";
import { Schema, Types, model } from "mongoose";

export interface ICentre {
  _id: Types.ObjectId;
  ReferenceNumber: string;
  TempReferenceNumber: string;
  CentreName: string;
  State: string;
  CentreCapacity: number;
  AdminName: string;
  AdminPhone: string;
  AdminEmail: string;
  DateCreated: Date;
}

export interface AuthenticatedCentre extends Request {
  centre?: ICentre;
}

const schema = new Schema<ICentre>({
  ReferenceNumber: { type: String, lowercase: true },
  TempReferenceNumber: { type: String, lowercase: true },
  CentreName: { type: String, lowercase: true },
  State: { type: String, lowercase: true },
  CentreCapacity: Number,
  AdminName: { type: String, lowercase: true },
  AdminPhone: { type: String, lowercase: true },
  AdminEmail: { type: String, lowercase: true },
  DateCreated: Date,
});

schema.pre("save", function (next) {
  this.DateCreated = new Date();
  next();
});
const CentreModel = model("Centre", schema);

export default CentreModel;

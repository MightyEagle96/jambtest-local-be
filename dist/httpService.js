"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpService = exports.baseURL = void 0;
const axios_1 = __importDefault(require("axios"));
exports.baseURL = process.env.NODE_ENV === "production"
    ? "https://miniautotestcentral-be.onrender.com/api"
    : //
        "http://192.168.16.70:4000/api";
const httpService = axios_1.default.create({
    baseURL: exports.baseURL,
    withCredentials: true, // always send cookies
    timeout: 50000,
    headers: {
        "Content-Type": "application/json",
        //adminid: loggedInAdmin ? loggedInAdmin._id : "",
    },
});
exports.httpService = httpService;
httpService.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response) {
        return { data: error.response.data, status: error.response.status };
    }
    return { data: "Cannot connect to the central server", status: 500 };
});

import axios from "axios";

export const baseURL =
  process.env.NODE_ENV === "production"
    ? "https://miniautotestcentral-be.onrender.com/api"
    : //
      "http://192.168.16.75:4000/api";

const httpService = axios.create({
  baseURL,
  withCredentials: true, // always send cookies
  timeout: 50_000,
  headers: {
    "Content-Type": "application/json",
    //adminid: loggedInAdmin ? loggedInAdmin._id : "",
  },
});

httpService.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      return { data: error.response.data, status: error.response.status };
    }

    return { data: "Cannot connect to the central server", status: 500 };
  }
);

export { httpService };

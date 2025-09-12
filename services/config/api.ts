import axios from "axios";

const api = axios.create({
  baseURL: "https://689f09433fed484cf878cfa6.mockapi.io/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config: any) => {
  return config;
});

api.interceptors.response.use(async (config: any) => {
  return config;
});

export default api;

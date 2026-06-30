import axios from "axios";
import API from "./api";

API.get("/products");
axios.get("http://localhost:5000/api/products")


const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

export default API;
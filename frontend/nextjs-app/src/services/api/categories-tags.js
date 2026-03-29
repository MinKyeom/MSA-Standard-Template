import axios from "axios";
import { postServiceBaseUrl } from "../../config/apiBase";

const client = axios.create();
client.interceptors.request.use((config) => {
  const b = postServiceBaseUrl();
  if (b) config.baseURL = b;
  return config;
});

export const fetchCategoriesList = async () => {
  try {
    const response = await client.get("/api/posts/categories");
    return response.data || [];
  } catch (error) {
    console.error("Error fetching categories list:", error);
    return [];
  }
};

export const fetchTagsList = async () => {
  try {
    const response = await client.get("/api/posts/tags");
    return response.data || [];
  } catch (error) {
    console.error("Error fetching tags list:", error);
    return [];
  }
};

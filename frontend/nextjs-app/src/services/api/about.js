import axios from "axios";
import { userServiceBaseUrl, authServiceBaseUrl } from "../../config/apiBase";

const aboutAxios = axios.create({ withCredentials: true });
aboutAxios.interceptors.request.use((config) => {
  const b = userServiceBaseUrl();
  if (b) config.baseURL = b;
  return config;
});

let isRefreshing = false;
let pendingRequests = [];

const flushPending = (error) => {
  pendingRequests.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  pendingRequests = [];
};

aboutAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    if (typeof window !== "undefined") {
      try {
        if (sessionStorage.getItem("auth_logout")) {
          return Promise.reject(error);
        }
      } catch (_) {}
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push({
          resolve: () => resolve(aboutAxios(originalRequest)),
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      await axios.post(`${authServiceBaseUrl()}/auth/refresh`, {}, { withCredentials: true });
      flushPending(null);
      return aboutAxios(originalRequest);
    } catch (refreshError) {
      flushPending(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/** Server Component / SSR */
export async function fetchAbout(options = {}) {
  const base = userServiceBaseUrl();
  if (!base) {
    throw new Error("User API base URL is not configured.");
  }

  const fetchOptions = {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  };

  if (typeof window === "undefined") {
    fetchOptions.next = options.next ?? { revalidate: 60 };
  }

  const res = await fetch(`${base}/user/about`, fetchOptions);

  if (!res.ok) {
    throw new Error(`Failed to fetch about page: ${res.status}`);
  }

  return res.json();
}

/** Client Component (편집 화면 등) */
export async function fetchAboutClient() {
  const response = await aboutAxios.get("/user/about");
  return response.data;
}

export async function updateAbout(payload) {
  const response = await aboutAxios.put("/user/about", payload);
  return response.data;
}

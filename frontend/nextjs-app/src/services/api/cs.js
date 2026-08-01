import axios from "axios";
import { postServiceBaseUrl, authServiceBaseUrl } from "../../config/apiBase";

/** CS Notes는 콘텐츠 도메인 → post-service (/api/cs) */
const csAxios = axios.create({ withCredentials: true });
csAxios.interceptors.request.use((config) => {
  const b = postServiceBaseUrl();
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

csAxios.interceptors.response.use(
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
          resolve: () => resolve(csAxios(originalRequest)),
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      await axios.post(`${authServiceBaseUrl()}/auth/refresh`, {}, { withCredentials: true });
      flushPending(null);
      return csAxios(originalRequest);
    } catch (refreshError) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("currentUserId");
        localStorage.removeItem("currentUserNickname");
      }
      flushPending(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/** Server Component / SSR */
export async function fetchCsSummary(options = {}) {
  const base = postServiceBaseUrl();
  if (!base) {
    throw new Error("Post API base URL is not configured.");
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

  const res = await fetch(`${base}/api/cs`, fetchOptions);

  if (!res.ok) {
    throw new Error(`Failed to fetch CS summary page: ${res.status}`);
  }

  return res.json();
}

/** Client Component (편집 화면 등) */
export async function fetchCsSummaryClient() {
  const response = await csAxios.get("/api/cs");
  return response.data;
}

export async function updateCsSummary(payload) {
  const response = await csAxios.put("/api/cs", payload);
  return response.data;
}

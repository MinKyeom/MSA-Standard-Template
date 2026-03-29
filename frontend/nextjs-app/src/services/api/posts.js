import axios from "axios";
import { postServiceBaseUrl, authServiceBaseUrl } from "../../config/apiBase";

const authAxios = axios.create({ withCredentials: true });
authAxios.interceptors.request.use((config) => {
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

authAxios.interceptors.response.use(
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
          resolve: () => resolve(authAxios(originalRequest)),
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const authBase = authServiceBaseUrl();
      await axios.post(`${authBase}/auth/refresh`, {}, { withCredentials: true });
      flushPending(null);
      return authAxios(originalRequest);
    } catch (refreshError) {
      flushPending(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/**
 * 게시글 목록 조회
 */
export const fetchPosts = async (
  page = 0,
  size = 10,
  category = null,
  tag = null,
  options = {}
) => {
  try {
    let path = "/api/posts";
    let params = { page, size };

    if (category) {
      path = "/api/posts/category";
      params.name = category;
    } else if (tag) {
      path = "/api/posts/tag";
      params.name = tag;
    }

    const response = await authAxios.get(path, { params, ...options });
    return response.data;
  } catch (error) {
    console.error("fetchPosts 에러:", error);
    throw error;
  }
};

export const fetchPopularPosts = async (limit = 6) => {
  try {
    const response = await authAxios.get("/api/posts/popular", {
      params: { limit },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("fetchPopularPosts 에러:", error);
    return [];
  }
};

export const recordVisit = async () => {
  try {
    const response = await authAxios.post("/api/posts/visits/record", null, {
      params: { _t: Date.now() },
      headers: { "Cache-Control": "no-cache" },
    });
    return response.data;
  } catch (error) {
    console.error("recordVisit 에러:", error);
    return null;
  }
};

export const fetchVisitStats = async () => {
  try {
    const response = await authAxios.get("/api/posts/visits/stats", {
      params: { _t: Date.now() },
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate", Pragma: "no-cache" },
    });
    return response.data || { today: 0, total: 0 };
  } catch (error) {
    console.error("fetchVisitStats 에러:", error);
    return { today: 0, total: 0 };
  }
};

export const fetchPostById = async (id, options = {}) => {
  try {
    const response = await authAxios.get(`/api/posts/${id}`, {
      ...options,
    });
    return response.data;
  } catch (error) {
    console.error("fetchPostById 에러:", error);
    throw error;
  }
};

export const createPost = async (postData) => {
  try {
    const response = await authAxios.post("/api/posts", postData);
    return response.data;
  } catch (error) {
    console.error("createPost 에러:", error.response?.data || error.message);
    throw error;
  }
};

export const updatePost = async (id, postData) => {
  try {
    const response = await authAxios.put(`/api/posts/${id}`, postData);
    return response.data;
  } catch (error) {
    console.error("updatePost 에러:", error.response?.data || error.message);
    throw error;
  }
};

export const deletePost = async (id) => {
  try {
    await authAxios.delete(`/api/posts/${id}`);
    return true;
  } catch (error) {
    console.error("deletePost 에러:", error.response?.data || error.message);
    throw error;
  }
};

export const createDraftPost = async (postData) => {
  const response = await authAxios.post("/api/post-drafts", postData);
  return response.data;
};

export const updateDraftPost = async (id, postData) => {
  const response = await authAxios.put(`/api/post-drafts/${id}`, postData);
  return response.data;
};

export const fetchMyDrafts = async (page = 0, size = 20) => {
  const response = await authAxios.get("/api/post-drafts/mine", {
    params: { page, size },
  });
  return response.data;
};

export const fetchDraftById = async (id) => {
  const response = await authAxios.get(`/api/post-drafts/${id}`);
  return response.data;
};

export const fetchLatestDraftForPost = async (postId) => {
  const response = await authAxios.get(`/api/post-drafts/for-post/${postId}`);
  return response.data || null;
};

export const publishDraftPost = async (id) => {
  const response = await authAxios.post(`/api/post-drafts/${id}/publish`);
  return response.data;
};

export const uploadPostCoverFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await authAxios.post("/api/posts/media/upload", formData);
  const url = response.data?.url;
  if (!url) throw new Error("업로드 응답에 url이 없습니다.");
  return url;
};

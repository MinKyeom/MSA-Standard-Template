// src/services/api/userService.js
import axios from "axios";
import { userServiceBaseUrl, authServiceBaseUrl } from "../../config/apiBase";

const userAxios = axios.create({ withCredentials: true });
userAxios.interceptors.request.use((config) => {
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

userAxios.interceptors.response.use(
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
          resolve: () => resolve(userAxios(originalRequest)),
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      await axios.post(`${authServiceBaseUrl()}/auth/refresh`, {}, { withCredentials: true });
      flushPending(null);
      return userAxios(originalRequest);
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

/**
 * 1. 내 정보 가져오기 (Me API)
 */
export const fetchMe = async () => {
  try {
    const response = await userAxios.get("/user/me");
    return response.data; // UserResponse
  } catch (error) {
    const status = error?.response?.status;
    // 인증 실패(401/403)는 호출부에서 '로그아웃 처리' 판단을 할 수 있도록 null로 반환
    if (status === 401 || status === 403) return null;
    // 일시 장애/네트워크 오류는 즉시 로그아웃으로 몰지 않기 위해 상위로 전달
    throw error;
  }
};

/**
 * 2. 닉네임 중복 체크
 */
export const checkNicknameDuplicate = async (nickname) => {
  const response = await userAxios.get("/user/check-nickname", {
    params: { nickname },
  });
  return response.data; // true: 중복, false: 사용가능
};

/**
 * 3. 아이디(Username) 중복 체크
 * (만약 이 로직이 user-service에 있다면 여기에 위치합니다)
 */
export const checkUsernameDuplicate = async (username) => {
  const response = await userAxios.get("/user/check-username", {
    params: { username },
  });
  return response.data;
};

export default userAxios;

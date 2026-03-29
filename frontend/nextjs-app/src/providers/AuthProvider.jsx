"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { getAuthUser, setOnUnauthorized, extendSession, fetchAuthMe, refreshSession } from "../services/api/auth";
import { fetchMe } from "../services/api/user";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// 액세스 토큰 만료 30분 — 만료 5분 전에 세션 연장 시도
const SESSION_EXTEND_INTERVAL_MS = 25 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    id: null,
    nickname: null,
    isAdmin: false,
  });
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const sessionTimerRef = useRef(null);

  const manualLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUserId");
      localStorage.removeItem("currentUserNickname");
      sessionStorage.setItem("auth_logout", "1");
    }
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    setAuthState({ isAuthenticated: false, id: null, nickname: null, isAdmin: false });
  };

  useEffect(() => {
    setOnUnauthorized(manualLogout);
  }, []);

  const fetchAndApplySessionUser = async () => {
    const [serverUser, authMe] = await Promise.all([fetchMe(), fetchAuthMe().catch(() => null)]);
    if (serverUser && serverUser.id) {
      const isAdmin = authMe?.role === "ROLE_ADMIN";
      const updatedState = {
        isAuthenticated: true,
        id: serverUser.id,
        nickname: serverUser.nickname ?? serverUser.username ?? "",
        isAdmin,
      };
      setAuthState(updatedState);
      localStorage.setItem("currentUserId", serverUser.id);
      localStorage.setItem("currentUserNickname", updatedState.nickname);
      return true;
    }
    return false;
  };

  // 로그인 상태일 때 25분마다 세션 연장 (만료 시 자동 로그아웃)
  useEffect(() => {
    if (!authState.isAuthenticated) {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      return;
    }
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    sessionTimerRef.current = setInterval(async () => {
      try {
        await extendSession();
      } catch (e) {
        try {
          await refreshSession();
          await extendSession();
        } catch (_) {
          manualLogout();
        }
      }
    }, SESSION_EXTEND_INTERVAL_MS);
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, [authState.isAuthenticated]);

  useEffect(() => {
    const initializeAuth = async () => {
      // 로그아웃 플래그는 "다음 로그인 성공 시"에만 제거합니다.
      // 여기서 지워버리면, 사용자가 로그아웃 후 새로고침을 2번 이상 했을 때
      // refreshSession()이 다시 동작하며 재로그인되는 경쟁조건이 생길 수 있습니다.
      if (typeof window !== "undefined" && sessionStorage.getItem("auth_logout")) {
        setAuthState({ isAuthenticated: false, id: null, nickname: null, isAdmin: false });
        setIsAuthInitialized(true);
        return;
      }

      const localUser = getAuthUser();
      if (localUser.isAuthenticated) {
        setAuthState(localUser);
      }

      try {
        let resolved = await fetchAndApplySessionUser();
        if (!resolved) {
          await refreshSession();
          resolved = await fetchAndApplySessionUser();
        }
        // localUser가 없는 상태에서만 강제 로그아웃(상태 초기화)
        // localUser가 있는 경우엔 401/refresh 실패 케이스에서만 manualLogout이 호출되도록 아래 catch에서 처리
        if (!resolved && !localUser.isAuthenticated) manualLogout();
      } catch (error) {
        const status = error?.response?.status;
        // 401/403은 실제 미인증/권한 문제로 판단 → 로그아웃
        if (status === 401 || status === 403) {
          manualLogout();
        } else {
          // 네트워크/일시 장애는 즉시 로그아웃하지 않고, 로컬 상태가 있으면 유지
          console.error("인증 확인 과정에서 일시적 오류 발생(로그아웃하지 않음):", error);
          if (!localUser.isAuthenticated) manualLogout();
        }
      } finally {
        setIsAuthInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const refreshAuth = () => {
    setAuthState(getAuthUser());
  };

  /** 로그인 직후 서버 응답으로 상태 즉시 반영 (새로고침 없이 로그아웃 버튼 등 표시) */
  const setLoginState = async (user) => {
    if (!user?.id) return;
    let isAdmin = false;
    try {
      const authMe = await fetchAuthMe();
      isAdmin = authMe?.role === "ROLE_ADMIN";
    } catch (_) {}
    const state = {
      isAuthenticated: true,
      id: user.id,
      nickname: user.nickname ?? user.username ?? "",
      isAdmin,
    };
    setAuthState(state);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("auth_logout");
      localStorage.setItem("currentUserId", user.id);
      localStorage.setItem("currentUserNickname", state.nickname);
    }
  };

  /** 수동 세션 연장 (버튼 클릭 시) — 30분 연장 */
  const extendSessionManually = async () => {
    try {
      try {
        await extendSession();
      } catch (_) {
        // 만료 직전이면 refresh 후 extend 재시도
        await refreshSession();
        await extendSession();
      }
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = setInterval(async () => {
        try {
          await extendSession();
        } catch (e) {
          manualLogout();
        }
      }, SESSION_EXTEND_INTERVAL_MS);
      return true;
    } catch (e) {
      manualLogout();
      return false;
    }
  };

  const value = {
    ...authState,
    refreshAuth,
    setLoginState,
    isAuthInitialized,
    manualLogout,
    extendSessionManually,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

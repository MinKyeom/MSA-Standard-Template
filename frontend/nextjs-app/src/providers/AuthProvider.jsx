"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getAuthUser,
  setOnUnauthorized,
  extendSession,
  fetchAuthMe,
  refreshSession,
  logoutUser,
} from "../services/api/auth";
import { fetchMe } from "../services/api/user";
import { useToast } from "../hooks/useToast";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

/** 백엔드 액세스 토큰 30분과 맞춤: 로그인·연장 시점부터 30분 후 만료 */
const ACCESS_SESSION_MS = 30 * 60 * 1000;
/** 만료 5분 전(연장 없을 때) 알림 1회 */
const WARN_REMAINING_MS = 5 * 60 * 1000;
const SESSION_TICK_MS = 30 * 1000;

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const { showToast } = useToast();
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    id: null,
    nickname: null,
    isAdmin: false,
  });
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [sessionExpiringSoon, setSessionExpiringSoon] = useState(false);
  const sessionTimerRef = useRef(null);
  const sessionEndsAtRef = useRef(0);
  const warnShownRef = useRef(false);

  const resetSessionDeadline = useCallback(() => {
    sessionEndsAtRef.current = Date.now() + ACCESS_SESSION_MS;
    warnShownRef.current = false;
    setSessionExpiringSoon(false);
  }, []);

  const manualLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUserId");
      localStorage.removeItem("currentUserNickname");
      sessionStorage.setItem("auth_logout", "1");
    }
    sessionEndsAtRef.current = 0;
    warnShownRef.current = false;
    setSessionExpiringSoon(false);
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

  /** 로그인 유지 중: 남은 시간이 5분 이하가 되면 토스트·배너 1회, 만료 시 자동 로그아웃 (자동 연장 없음) */
  useEffect(() => {
    if (!authState.isAuthenticated) {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      return undefined;
    }
    resetSessionDeadline();
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    sessionTimerRef.current = setInterval(async () => {
      const now = Date.now();
      const end = sessionEndsAtRef.current;
      if (!end) return;
      const remaining = end - now;
      if (remaining <= 0) {
        if (sessionTimerRef.current) {
          clearInterval(sessionTimerRef.current);
          sessionTimerRef.current = null;
        }
        try {
          await logoutUser();
        } catch (_) {
          /* ignore */
        }
        manualLogout();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:session-ended"));
          try {
            router.refresh();
          } catch (_) {
            /* ignore */
          }
        }
        return;
      }
      if (remaining <= WARN_REMAINING_MS && !warnShownRef.current) {
        warnShownRef.current = true;
        setSessionExpiringSoon(true);
        showToast({
          message:
            "로그인 세션 만료까지 약 5분 남았습니다. 상단에서 세션 연장(Extend session)을 눌러 주세요.",
          type: "warning",
          durationMs: 10000,
        });
      }
    }, SESSION_TICK_MS);
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, [authState.isAuthenticated, resetSessionDeadline, showToast, router]);

  useEffect(() => {
    const initializeAuth = async () => {
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
        if (resolved) resetSessionDeadline();
        if (!resolved && !localUser.isAuthenticated) manualLogout();
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          manualLogout();
        } else {
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
    resetSessionDeadline();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("auth_logout");
      localStorage.setItem("currentUserId", user.id);
      localStorage.setItem("currentUserNickname", state.nickname);
    }
  };

  const extendSessionManually = async () => {
    try {
      try {
        await extendSession();
      } catch (_) {
        await refreshSession();
        await extendSession();
      }
      resetSessionDeadline();
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
    sessionExpiringSoon,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { logoutUser } from "../../services/api/auth";
import { useAuth } from "../../providers/AuthProvider";
import { useToast } from "../../hooks/useToast";
import Sidebar from "./Sidebar";
import HeaderThemeToggle from "./HeaderThemeToggle";
import SearchBar from "../Search/SearchBar";
import "../../styles/Header.css";

export default function Header() {
  const { isAuthenticated, nickname, manualLogout, extendSessionManually, sessionExpiringSoon } =
    useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [extending, setExtending] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileAuthOpen, setMobileAuthOpen] = useState(false);
  const mobileAuthRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    if (searchOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!mobileAuthRef.current) return;
      if (!mobileAuthRef.current.contains(event.target)) {
        setMobileAuthOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) setMobileAuthOpen(false);
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      manualLogout();
      showToast({ message: "Logged out.", type: "success" });
      setMobileAuthOpen(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      showToast({ message: "오류가 발생했습니다.", type: "error" });
      console.error(error);
      manualLogout();
      setMobileAuthOpen(false);
      router.push("/");
      router.refresh();
    }
  };

  const handleExtendSession = async () => {
    setExtending(true);
    try {
      const ok = await extendSessionManually();
      if (ok) showToast({ message: "Session extended by 30 minutes.", type: "success" });
    } catch (e) {
      showToast({ message: "Failed to extend session.", type: "error" });
    } finally {
      setExtending(false);
    }
  };

  return (
    <>
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        closeSidebar={() => setIsSidebarOpen(false)}
      />

      {/* 풀스크린 검색 오버레이: 중앙 검색대 + X/돌아가기 */}
      {searchOpen && (
        <div
          className="search-overlay-fullscreen"
          role="dialog"
          aria-modal="true"
          aria-label="검색"
        >
          <div className="search-overlay-backdrop" onClick={() => setSearchOpen(false)} aria-hidden />
          <div className="search-overlay-content">
            <SearchBar
              variant="hero"
              placeholder="Search posts..."
              onNavigate={() => setSearchOpen(false)}
            />
            <div className="search-overlay-actions">
              <button
                type="button"
                className="search-overlay-close"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
                <span>닫기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="header-sticky-stack">
        {isAuthenticated && sessionExpiringSoon && (
          <div className="session-expiry-banner" role="status">
            세션 만료까지 약 5분 남았습니다.{" "}
            <button
              type="button"
              className="session-expiry-banner__extend"
              onClick={handleExtendSession}
              disabled={extending}
            >
              {extending ? "연장 중…" : "지금 연장"}
            </button>
          </div>
        )}

        <header className="main-header">
        <div className="header-content-fluid">
          <div className="header-left-group">
            <button
              className="hamburger-button-fixed"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="메뉴 열기"
            >
              ☰
            </button>

            <Link href="/" className="logo-text-header">
              MinKowskiM
            </Link>

            <HeaderThemeToggle />
          </div>

          <div className="header-right-group">
            <div className="header-search-wrap">
              <button
                type="button"
                className="header-search-toggle"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
                aria-expanded={searchOpen}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            </div>

            <nav className="header-auth-nav">
              {isAuthenticated ? (
                <>
                  <div className="auth-user-info">
                    <span className="user-nickname-display">{nickname || "User"}</span>
                    <div className="auth-user-actions">
                      <button
                        type="button"
                        onClick={handleExtendSession}
                        disabled={extending}
                        className="btn-primary-small"
                        title="Extend session by 30 min"
                      >
                        {extending ? "Extending…" : "Extend session"}
                      </button>
                      <button onClick={handleLogout} className="btn-primary-small">
                        Log out
                      </button>
                    </div>
                  </div>
                  <div className="mobile-auth-menu" ref={mobileAuthRef}>
                    <button
                      type="button"
                      className="mobile-auth-toggle"
                      aria-label="Open user menu"
                      aria-expanded={mobileAuthOpen}
                      onClick={() => setMobileAuthOpen((prev) => !prev)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 21a8 8 0 0 0-16 0" />
                        <circle cx="12" cy="8" r="4" />
                      </svg>
                    </button>
                    {mobileAuthOpen && (
                      <div className="mobile-auth-dropdown">
                        <div className="mobile-auth-nickname">{nickname || "User"}</div>
                        <button
                          type="button"
                          onClick={handleExtendSession}
                          disabled={extending}
                          className="btn-primary-small mobile-auth-action"
                        >
                          {extending ? "Extending…" : "Extend session"}
                        </button>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="btn-primary-small mobile-auth-action"
                        >
                          Log out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="auth-links">
                  <Link href="/signin" className="btn-primary-small">
                    Log in
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>
      </div>
    </>
  );
}

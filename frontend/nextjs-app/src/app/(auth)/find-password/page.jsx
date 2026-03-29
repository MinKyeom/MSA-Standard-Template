"use client";

import { useState } from "react";
import Link from "next/link";
import { sendResetPasswordCode, resetPasswordVerify } from "../../../services/api/auth";
import { useToast } from "../../../hooks/useToast";

export default function FindPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast({ message: "Please enter your email.", type: "warning" });
      return;
    }
    setLoading(true);
    try {
      await sendResetPasswordCode(email.trim());
      showToast({ message: "Verification code has been sent to your email.", type: "success" });
      setStep(2);
    } catch (err) {
      showToast({ message: err.response?.data?.message || err.message || "발송 실패", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!code.trim() || !newPassword.trim()) {
      showToast({ message: "Please enter the verification code and new password.", type: "warning" });
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      showToast({ message: "Passwords do not match.", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      showToast({ message: "Password must be at least 6 characters.", type: "warning" });
      return;
    }
    setLoading(true);
    try {
      await resetPasswordVerify(email.trim(), code.trim(), newPassword);
      setDone(true);
      showToast({ message: "Password has been changed.", type: "success" });
    } catch (err) {
      showToast({ message: err.response?.data?.message || err.message || "변경 실패", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Find password</h1>
        {step === 1 && (
          <form className="auth-form" onSubmit={handleSendCode}>
            <div className="form-group">
              <label>Email used for registration</label>
              <input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", marginTop: "1rem" }}>
              {loading ? "Sending..." : "Send code"}
            </button>
          </form>
        )}
        {step === 2 && !done && (
          <form className="auth-form" onSubmit={handleReset}>
            <div className="form-group">
              <label>Email</label>
              <input type="text" value={email} readOnly disabled style={{ opacity: 0.8 }} />
            </div>
            <div className="form-group">
              <label>Verification code</label>
              <input
                type="text"
                placeholder="6 digits"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>New password</label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Confirm new password</label>
              <input
                type="password"
                placeholder="Re-enter"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", marginTop: "1rem" }}>
              {loading ? "Changing..." : "Change password"}
            </button>
          </form>
        )}
        {done && (
          <div className="auth-form" style={{ padding: "1.5rem" }}>
            <p style={{ marginBottom: "1rem", color: "var(--color-text-main)" }}>Your password has been changed. Please sign in with your new password.</p>
            <Link href="/signin" className="btn-primary" style={{ display: "inline-block", marginTop: "1rem", textAlign: "center" }}>
              Sign in
            </Link>
          </div>
        )}
        <div className="auth-link" style={{ marginTop: "1.5rem" }}>
          <Link href="/signin">Sign in</Link>
          {" · "}
          <Link href="/find-username">Find username</Link>
        </div>
      </div>
    </div>
  );
}

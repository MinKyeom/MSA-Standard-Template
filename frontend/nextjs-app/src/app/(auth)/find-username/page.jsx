"use client";

import { useState } from "react";
import Link from "next/link";
import { sendFindUsernameCode, findUsernameVerify } from "../../../services/api/auth";
import { useToast } from "../../../hooks/useToast";

export default function FindUsernamePage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
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
      await sendFindUsernameCode(email.trim());
      showToast({ message: "Verification code has been sent to your email.", type: "success" });
      setStep(2);
    } catch (err) {
      showToast({ message: err.response?.data?.message || err.message || "발송 실패", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      showToast({ message: "Please enter the verification code.", type: "warning" });
      return;
    }
    setLoading(true);
    try {
      const res = await findUsernameVerify(email.trim(), code.trim());
      setUsername(res.username || "");
      showToast({ message: "Username found.", type: "success" });
    } catch (err) {
      showToast({ message: err.response?.data?.message || err.message || "인증 실패", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Find username</h1>
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
        {step === 2 && !username && (
          <form className="auth-form" onSubmit={handleVerify}>
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
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", marginTop: "1rem" }}>
              {loading ? "Verifying..." : "Find username"}
            </button>
          </form>
        )}
        {username && (
          <div className="auth-form" style={{ padding: "1.5rem" }}>
            <p style={{ marginBottom: "1rem", color: "var(--color-text-main)" }}>Your username</p>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-accent)" }}>{username}</p>
            <Link href="/signin" className="btn-primary" style={{ display: "inline-block", marginTop: "1rem", textAlign: "center" }}>
              Sign in
            </Link>
          </div>
        )}
        <div className="auth-link" style={{ marginTop: "1.5rem" }}>
          <Link href="/signin">Sign in</Link>
          {" · "}
          <Link href="/find-password">Find password</Link>
        </div>
      </div>
    </div>
  );
}

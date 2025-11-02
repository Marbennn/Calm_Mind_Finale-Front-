// src/pages/ForgotPassword.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email"); // "email" | "reset"

  // form fields
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // ui state
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  // errors
  const [errors, setErrors] = useState({});

  const emailRef = useRef(null);
  const codeRef = useRef(null);

  useEffect(() => {
    if (step === "email") emailRef.current?.focus();
    if (step === "reset") codeRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const passwordIssues = (val) => {
    const issues = [];
    if (val.length < 8) issues.push("At least 8 characters");
    if (!/[A-Z]/.test(val)) issues.push("At least 1 uppercase letter");
    if (!/[a-z]/.test(val)) issues.push("At least 1 lowercase letter");
    if (!/[0-9]/.test(val)) issues.push("At least 1 number");
    return issues;
  };

  // ✅ Send reset code
  const handleSendCode = async (e) => {
    e.preventDefault();
    const nextErr = {};
    if (!email) nextErr.email = "Email is required.";
    else if (!validateEmail(email)) nextErr.email = "Enter a valid email.";
    setErrors(nextErr);
    if (Object.keys(nextErr).length) return;

    try {
      setLoading(true);
      await api.post("http://localhost:4000/api/users/forgot-password", {
        email,
      });
      setLoading(false);
      setStep("reset");
      setCooldown(60);
    } catch (err) {
      console.error("Forgot password failed:", err);
      setErrors({
        email:
          err.response?.data?.message ||
          "Error sending reset code. Please try again.",
      });
      setLoading(false);
    }
  };

  // Resend code
  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      setLoading(true);
      await api.post("http://localhost:4000/api/users/forgot-password", {
        email,
      });
      setLoading(false);
      setCooldown(60);
    } catch (err) {
      console.error("Resend failed:", err);
      setErrors({
        code:
          err.response?.data?.message ||
          "Failed to resend code. Try again later.",
      });
      setLoading(false);
    }
  };

  // ✅ Verify + Reset password
  const handleReset = async (e) => {
    e.preventDefault();
    const nextErr = {};

    if (!/^\d{6}$/.test(code)) nextErr.code = "Enter the 6-digit code.";
    const issues = passwordIssues(password);
    if (issues.length) nextErr.password = issues.join(" • ");
    if (confirm !== password) nextErr.confirm = "Passwords do not match.";

    setErrors(nextErr);
    if (Object.keys(nextErr).length) return;

    try {
      setLoading(true);
      await api.post(`http://localhost:4000/api/users/reset-password`, {
        email,
        code,
        newPassword: password,
      });
      setLoading(false);

      // Redirect to login after successful update
      navigate("/login", { replace: true, state: { resetSuccess: true } });
    } catch (err) {
      console.error("Reset failed:", err);
      setErrors({
        code:
          err.response?.data?.message ||
          "Invalid or expired code. Please try again.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-lg rounded-2xl p-6 md:p-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-indigo-600/10 flex items-center justify-center">
              <span className="text-indigo-600 text-xl font-bold">🔒</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              Forgot Password
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {step === "email"
                ? "Enter your email to receive a verification code."
                : "Check your inbox for the 6-digit code, then set a new password."}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <StepDot active={true} />
            <StepLine active={step === "reset"} />
            <StepDot active={step === "reset"} />
          </div>

          {/* Forms */}
          {step === "email" ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <input
                  ref={emailRef}
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
                    errors.email
                      ? "border-red-300 ring-red-200"
                      : "border-gray-300 focus:ring-indigo-200"
                  }`}
                  autoComplete="email"
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-black text-white py-2.5 text-sm font-medium hover:bg-gray-800 transition disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Verification Code"}
              </button>

              <div className="text-xs text-gray-500 text-center">
                Remembered your password?{" "}
                <a href="/login" className="text-yellow-500 hover:underline">
                  Back to Sign in
                </a>
              </div>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              {/* read-only email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700"
                  />
                  <button
                    type="button"
                    className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
                    onClick={() => setStep("email")}
                  >
                    Use another email
                  </button>
                </div>
              </div>

              {/* code */}
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700"
                >
                  Verification code
                </label>
                <input
                  ref={codeRef}
                  id="code"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="6-digit code"
                  className={`mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
                    errors.code
                      ? "border-red-300 ring-red-200"
                      : "border-gray-300 focus:ring-indigo-200"
                  }`}
                  required
                />
                <div className="mt-2 flex items-center justify-between text-xs">
                  <p className="text-gray-500">
                    Didn’t get it?{" "}
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={cooldown > 0 || loading}
                      className={`font-medium ${
                        cooldown > 0
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-indigo-600 hover:underline"
                      }`}
                    >
                      Resend
                    </button>
                    {cooldown > 0 && (
                      <span className="ml-1 text-gray-400">({cooldown}s)</span>
                    )}
                  </p>
                </div>
                {errors.code && (
                  <p className="mt-1 text-xs text-red-600">{errors.code}</p>
                )}
              </div>

              {/* new password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  New password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm pr-10 outline-none transition focus:ring-2 ${
                      errors.password
                        ? "border-red-300 ring-red-200"
                        : "border-gray-300 focus:ring-indigo-200"
                    }`}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute inset-y-0 right-2 my-auto h-8 rounded px-2 text-xs text-gray-600 hover:bg-gray-100"
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
                <PasswordChecklist value={password} />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
              </div>

              {/* confirm */}
              <div>
                <label
                  htmlFor="confirm"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm new password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirm"
                    type={showPw2 ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm pr-10 outline-none transition focus:ring-2 ${
                      errors.confirm
                        ? "border-red-300 ring-red-200"
                        : "border-gray-300 focus:ring-indigo-200"
                    }`}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw2((s) => !s)}
                    className="absolute inset-y-0 right-2 my-auto h-8 rounded px-2 text-xs text-gray-600 hover:bg-gray-100"
                  >
                    {showPw2 ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.confirm && (
                  <p className="mt-1 text-xs text-red-600">{errors.confirm}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-black text-white py-2.5 text-sm font-medium hover:bg-gray-800 transition disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>

              <div
                className="text-center text-xs text-gray-500"
                aria-live="polite"
              >
                Having trouble? Contact support.
              </div>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Your App
        </p>
      </div>
    </div>
  );
}

/* ----- Small subcomponents ----- */

function StepDot({ active }) {
  return (
    <span
      className={`h-2.5 w-2.5 rounded-full ${
        active ? "bg-black" : "bg-gray-300"
      }`}
      aria-hidden="true"
    />
  );
}

function StepLine({ active }) {
  return (
    <span
      className={`h-0.5 w-10 rounded ${active ? "bg-black" : "bg-gray-300"}`}
      aria-hidden="true"
    />
  );
}

function PasswordChecklist({ value }) {
  const checks = [
    { ok: value.length >= 8, label: "8+ chars" },
    { ok: /[A-Z]/.test(value), label: "Uppercase" },
    { ok: /[a-z]/.test(value), label: "Lowercase" },
    { ok: /[0-9]/.test(value), label: "Number" },
  ];
  return (
    <ul className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-gray-500">
      {checks.map((c) => (
        <li key={c.label} className="flex items-center gap-1">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              c.ok ? "bg-emerald-500" : "bg-gray-300"
            }`}
          />
          {c.label}
        </li>
      ))}
    </ul>
  );
}

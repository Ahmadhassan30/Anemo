"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TerminalAnimation } from "@/components/TerminalAnimation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"professor" | "student">("professor");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      if (!res.ok) {
        const data = await res.json();
        let errMsg = "Registration failed. Try again.";
        if (typeof data.detail === "string") {
          errMsg = data.detail;
        } else if (Array.isArray(data.detail)) {
          errMsg = data.detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join(', ');
        } else if (data.detail && typeof data.detail === "object") {
          errMsg = JSON.stringify(data.detail);
        }
        setError(errMsg);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Left column — brand + tagline + terminal */}
      <div className="hidden flex-1 flex-col justify-between bg-zinc-950 p-12 lg:flex">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            <span className="text-indigo-400">›</span> LectureOS
          </h1>
          <p className="mt-3 max-w-sm text-sm text-zinc-300">
            Turn lectures into animated explanations. Author once, render
            everywhere.
          </p>
        </div>

        <div className="my-10">
          <TerminalAnimation />
        </div>

        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
          ~/lectureos/register
        </p>
      </div>

      {/* Right column — register form */}
      <div className="flex w-full flex-col justify-center border-l border-zinc-800 bg-zinc-900 px-6 py-12 lg:w-[480px] lg:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">
              auth / register
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">
              Create account
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Publish lectures or follow along — pick a role to begin.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded border border-red-800 bg-red-950 p-3 text-sm text-red-400">
              <span aria-hidden>✘</span>
              <p>
                <span className="font-mono text-zinc-500">err: </span>
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-start gap-3 rounded border border-green-800 bg-green-950 p-3 text-sm text-green-400">
              <span aria-hidden>✔</span>
              <p>Account created — redirecting to sign in →</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-widest text-zinc-500">
                Account type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("professor")}
                  className={`flex items-center justify-center gap-2 rounded border py-2.5 text-sm transition-colors duration-150 ${
                    role === "professor"
                      ? "border-zinc-700 bg-indigo-950 text-indigo-400"
                      : "border-zinc-800 bg-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                  }`}
                >
                  <span aria-hidden>{role === "professor" ? "●" : "○"}</span>
                  Professor
                </button>
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex items-center justify-center gap-2 rounded border py-2.5 text-sm transition-colors duration-150 ${
                    role === "student"
                      ? "border-zinc-700 bg-indigo-950 text-indigo-400"
                      : "border-zinc-800 bg-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                  }`}
                >
                  <span aria-hidden>{role === "student" ? "●" : "○"}</span>
                  Student
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-widest text-zinc-500">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@school.edu"
                className="w-full rounded border border-zinc-800 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors duration-150 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-widest text-zinc-500">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (min 8 chars)"
                className="w-full rounded border border-zinc-800 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors duration-150 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full rounded bg-indigo-500 py-2.5 text-sm font-semibold text-zinc-100 transition-colors duration-150 hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="font-mono">⟳ Creating account...</span>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <hr className="my-6 border-zinc-800" />

          <p className="text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-indigo-400 transition-colors duration-150 hover:text-indigo-400"
            >
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

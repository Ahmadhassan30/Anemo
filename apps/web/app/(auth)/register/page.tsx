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
    <div className="flex h-screen overflow-hidden">
      {/* Left Column */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-950 flex-col justify-between p-12">
        <div>
          <span className="font-mono font-bold text-zinc-100 text-lg">LectureOS</span>
        </div>
        <div className="max-w-xs">
          <p className="text-2xl font-light text-zinc-300 leading-relaxed">
            Turn any lecture into an animated course.
          </p>
        </div>
        <div className="max-w-md">
          <TerminalAnimation />
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full lg:w-1/2 bg-zinc-900 border-l border-zinc-800 flex items-center justify-center">
        <div className="w-full max-w-sm mx-auto px-8">
          <h1 className="text-zinc-100 text-2xl font-semibold mb-8">Create account</h1>

          {error && (
            <div className="mb-6 rounded border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded border border-green-800 bg-green-950 px-4 py-3 text-sm text-green-400">
              ✔ Account created — redirecting to sign in...
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="uppercase tracking-widest text-[10px] text-zinc-500 mb-3 block">
                Account type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("professor")}
                  className={`py-2.5 text-sm rounded border transition-colors duration-150 ${
                    role === "professor"
                      ? "border-indigo-500 bg-indigo-950 text-indigo-400"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  Professor
                </button>
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`py-2.5 text-sm rounded border transition-colors duration-150 ${
                    role === "student"
                      ? "border-indigo-500 bg-indigo-950 text-indigo-400"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  Student
                </button>
              </div>
            </div>

            <div>
              <label className="uppercase tracking-widest text-[10px] text-zinc-500 mb-2 block">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@school.edu"
                className="w-full bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 px-4 py-3 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors duration-150"
              />
            </div>

            <div>
              <label className="uppercase tracking-widest text-[10px] text-zinc-500 mb-2 block">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (min 8 chars)"
                className="w-full bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 px-4 py-3 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors duration-150"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="bg-indigo-500 hover:bg-indigo-400 text-white font-medium py-3 w-full rounded transition-colors duration-150 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-zinc-500 text-sm text-center mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-zinc-300 hover:text-zinc-100 transition-colors">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

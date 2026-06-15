"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TerminalAnimation } from "@/components/TerminalAnimation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
        setLoading(false);
      } else {
        if (email.toLowerCase().includes("professor")) {
          router.push("/professor/dashboard");
        } else {
          router.push("/student/dashboard");
        }
        router.refresh();
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
          <h1 className="text-zinc-100 text-2xl font-semibold mb-8">Sign in</h1>

          {error && (
            <div className="mb-6 rounded border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="uppercase tracking-widest text-[10px] text-zinc-500 mb-2 block">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="professor@demo.com"
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
                placeholder="••••••••"
                className="w-full bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 px-4 py-3 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors duration-150"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-500 hover:bg-indigo-400 text-white font-medium py-3 w-full rounded transition-colors duration-150 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-zinc-500 hover:text-zinc-300 text-sm text-center mt-6 transition-colors">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-zinc-300 hover:text-zinc-100">
              Register →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

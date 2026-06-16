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
    <div className="grid h-screen grid-cols-2 overflow-hidden">
      {/* LEFT */}
      <div className="flex flex-col bg-zinc-950 p-12">
        <div className="font-mono font-bold text-zinc-100">LectureOS</div>

        <div className="flex flex-1 items-center">
          <p className="max-w-xs text-2xl font-light text-zinc-300">
            Turn any lecture into an animated course.
          </p>
        </div>

        <div className="h-[40%]">
          <TerminalAnimation />
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center border-l border-zinc-800 bg-zinc-900">
        <div className="mx-auto w-full max-w-sm px-8">
          <h1 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-100">
            Sign in
          </h1>

          {error && (
            <div className="pill mb-6 flex items-start gap-2 border-red-800 bg-red-950 text-red-400">
              <span aria-hidden>✘</span>
              <p>{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              className="w-full rounded border-0 bg-zinc-800 px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-1 focus:ring-indigo-500"
            />

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              className="w-full rounded border-0 bg-zinc-800 px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-1 focus:ring-indigo-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-indigo-500 py-3 font-medium text-white transition-colors duration-150 hover:bg-indigo-400"
            >
              {loading ? "⟳ Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            <Link href="/register" className="transition-colors duration-150 hover:text-zinc-300">
              Don&apos;t have an account? Register →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Terminal, AnimatedSpan, TypingAnimation } from "@/components/magicui/terminal";

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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — brand + live demo */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#f5f7fb] via-canvas to-[#eef1f6] p-12 lg:flex">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-white">L</span>
          LectureOS
        </Link>

        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-ink">
            Turn any lecture into an animated course.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-subtle">
            Upload a recording. Watch the pipeline transcribe, segment, animate and narrate it —
            live, in your terminal.
          </p>

          <Terminal className="mt-8" title="lectureos — pipeline">
            <TypingAnimation className="text-term-fg">&gt; lectureos render lecture.mp4</TypingAnimation>
            <AnimatedSpan delay={1400} className="text-term-green">✔ extracting audio</AnimatedSpan>
            <AnimatedSpan delay={2000} className="text-term-green">✔ transcribing — whisper</AnimatedSpan>
            <AnimatedSpan delay={2600} className="text-term-green">✔ segmenting concepts — 6 found</AnimatedSpan>
            <AnimatedSpan delay={3300} className="text-term-blue">▸ rendering manim scenes…</AnimatedSpan>
            <AnimatedSpan delay={4000} className="text-term-green">✔ composing 1080p60 + narration</AnimatedSpan>
            <TypingAnimation delay={4700} className="text-term-muted">Done — 00:58 / 60s. Ready to publish.</TypingAnimation>
          </Terminal>
        </div>

        <p className="text-xs text-faint">© {new Date().getFullYear()} LectureOS</p>
      </div>

      {/* Right — register */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-10 flex items-center gap-2 text-[15px] font-semibold tracking-tight lg:hidden">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-white">L</span>
            LectureOS
          </Link>

          <h1 className="text-[28px] font-semibold tracking-tight text-ink">Create account</h1>
          <p className="mt-1.5 text-[15px] text-subtle">Publish lectures or follow along — pick a role to begin.</p>

          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
              <span aria-hidden>✘</span>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-6 flex items-start gap-2 rounded-xl border border-positive/20 bg-positive/5 px-4 py-3 text-sm text-positive">
              <span aria-hidden>✓</span>
              <p>Account created — redirecting to sign in →</p>
            </div>
          )}

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-subtle">Account type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("professor")}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm transition-all duration-200 ${
                    role === "professor"
                      ? "border-accent bg-accent/5 text-accent"
                      : "border-line bg-surface text-subtle hover:border-line-strong"
                  }`}
                >
                  <span aria-hidden>{role === "professor" ? "●" : "○"}</span>
                  Professor
                </button>
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm transition-all duration-200 ${
                    role === "student"
                      ? "border-accent bg-accent/5 text-accent"
                      : "border-line bg-surface text-subtle hover:border-line-strong"
                  }`}
                >
                  <span aria-hidden>{role === "student" ? "●" : "○"}</span>
                  Student
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[13px] font-medium text-subtle">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-[15px] text-ink placeholder:text-faint transition-shadow duration-200 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/12"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[13px] font-medium text-subtle">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (min 8 chars)"
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-[15px] text-ink placeholder:text-faint transition-shadow duration-200 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/12"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-accent text-[15px] font-medium text-white shadow-sm transition-all duration-200 hover:bg-accent-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-subtle">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

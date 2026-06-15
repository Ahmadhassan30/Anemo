"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, User, AlertCircle, CheckCircle2 } from "lucide-react";

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
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* prompt eyebrow */}
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-primary">{"//"}</span>
          <span className="term-label">auth / register</span>
        </div>

        <div className="term-window glow-ring pt-9">
          <div className="absolute right-4 top-3 text-[11px] text-muted-foreground">
            ~/lectureos/register
          </div>

          <div className="space-y-7 px-6 pb-7">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                <span className="text-primary">{"› "}</span>
                lecture<span className="text-primary glow-text">os</span>
                <span className="term-cursor align-middle" aria-hidden />
              </h1>
              <p className="mt-2 text-sm text-muted-foreground term-prompt">
                create_account --to publish or learn
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-3 rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>
                  <span className="text-destructive/70">err: </span>
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-3 rounded-sm border border-primary/40 bg-primary/10 p-3 text-sm text-primary">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <p>ok: account_created — redirecting to /login ...</p>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label className="term-label mb-2 block">
                    account_type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("professor")}
                      className={`flex items-center justify-center gap-2 rounded-sm border py-2.5 text-sm transition-all ${
                        role === "professor"
                          ? "border-primary bg-primary/10 text-primary glow-ring"
                          : "border-border bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <User className="h-4 w-4" />
                      professor
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={`flex items-center justify-center gap-2 rounded-sm border py-2.5 text-sm transition-all ${
                        role === "student"
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-background/40 text-muted-foreground hover:border-accent/40 hover:text-foreground"
                      }`}
                    >
                      <User className="h-4 w-4" />
                      student
                    </button>
                  </div>
                </div>

                <div>
                  <label className="term-label mb-2 block">
                    email_address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@school.edu"
                      className="term-input pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="term-label mb-2 block">
                    password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="•••••••• (min 8 chars)"
                      className="term-input pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || success}
                  className="term-btn term-btn-primary w-full py-2.5"
                >
                  {loading ? "registering..." : "$ create_account"}
                </button>
              </div>
            </form>

            <hr className="term-rule" />

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                already_registered?{" "}
                <Link href="/login" className="term-link">
                  sign_in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, AlertCircle } from "lucide-react";

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
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* brand line */}
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-sm">
          <span className="text-primary">{"//"}</span>
          <span className="font-semibold tracking-wide text-foreground">lecture</span>
          <span className="font-semibold tracking-wide text-primary glow-text">os</span>
        </Link>

        {/* auth terminal window */}
        <div className="term-window w-full pt-9 glow-ring">
          <div className="absolute right-4 top-3 text-[11px] text-muted-foreground">
            ~/auth/login
          </div>

          <div className="space-y-7 px-6 pb-7">
            <div>
              <h1 className="term-prompt text-lg font-semibold tracking-tight text-foreground">
                authenticate<span className="term-cursor align-middle" aria-hidden />
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="text-primary">{"› "}</span>
                sign in to access your dashboard
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-3 rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  <span className="text-destructive">[error]</span> {error}
                </p>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label className="term-label mb-2 block">email_address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="professor@demo.com"
                      className="term-input pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="term-label mb-2 block">password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="term-input pl-9"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="term-btn term-btn-primary w-full py-3 text-sm"
              >
                {loading ? "authenticating..." : "$ sign_in"}
              </button>
            </form>

            <hr className="term-rule" />

            <p className="text-center text-xs text-muted-foreground">
              no account yet?{" "}
              <Link href="/register" className="term-link">
                create_account
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          <span className="text-primary">{"//"}</span> secured session · credentials provider
        </p>
      </div>
    </div>
  );
}

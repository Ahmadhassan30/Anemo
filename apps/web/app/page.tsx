import React from "react";
import Link from "next/link";
import { TerminalAnimation } from "@/components/TerminalAnimation";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-300">
      {/* Nav */}
      <header className="flex h-12 items-center justify-between border-b border-zinc-800 px-6">
        <span className="font-mono text-sm font-bold text-zinc-100">LectureOS</span>
        <div className="flex items-center gap-5 text-sm">
          <Link
            href="/login"
            className="text-zinc-500 transition-colors duration-150 hover:text-zinc-300"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-indigo-400"
          >
            Get started →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-12 px-8 py-20">
        <div className="flex flex-col items-center text-center">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            agentic lecture → animation
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-light leading-tight tracking-tight text-zinc-100 md:text-6xl">
            Turn any lecture into an animated course.
          </h1>
          <p className="mt-6 max-w-xl text-zinc-500">
            Transcribe, segment the core concepts, render Manim scenes with synchronized narration,
            and ship a captioned video — automatically.
          </p>
          <div className="mt-10 flex items-center gap-3">
            <Link
              href="/register"
              className="rounded bg-indigo-500 px-6 py-3 font-medium text-white transition-colors duration-150 hover:bg-indigo-400"
            >
              Create account →
            </Link>
            <Link
              href="/login"
              className="rounded border border-zinc-800 px-6 py-3 text-zinc-300 transition-colors duration-150 hover:border-zinc-700"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Terminal */}
        <div className="w-full max-w-2xl rounded border border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-1.5 border-b border-zinc-800 px-3 py-2.5">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
            <span className="ml-3 font-mono text-[11px] text-zinc-500">lectureos — pipeline</span>
          </div>
          <div className="p-4">
            <TerminalAnimation />
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-800 px-6 py-6 text-center font-mono text-[10px] text-zinc-600">
        © {new Date().getFullYear()} LectureOS — next-gen educational animation
      </footer>
    </div>
  );
}

import React from "react";
import Link from "next/link";
import { Terminal, AnimatedSpan, TypingAnimation } from "@/components/magicui/terminal";

const FEATURES = [
  {
    title: "Watch it build, live",
    body: "Every stage — ingest, transcribe, segment, render, narrate — streams to a real terminal as it runs. No spinners, no guessing.",
  },
  {
    title: "3Blue1Brown-style scenes",
    body: "A template engine renders premium Manim animations with synchronized narration and captions — capped to a tight one-minute cut.",
  },
  {
    title: "A study companion",
    body: "Students get a player with chapters, a transcript-grounded chat tutor with citations, quizzes and notes — all in one place.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="glass sticky top-0 z-50">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <img src="/Logo.png" alt="Anemo Logo" className="h-7 w-7 object-contain" />
            Anemo
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-subtle transition-colors hover:text-ink">
              Sign in
            </Link>
            <Link href="/register" className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-hover">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6">
        <section className="flex flex-col items-center pt-20 pb-10 text-center">
          <span className="pill bg-fill text-subtle">Agentic lecture → animation</span>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight text-ink md:text-6xl">
            Turn any lecture into an
            <span className="text-accent"> animated course.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-subtle">
            Upload a recording and watch a pipeline of AI agents transcribe, segment, animate and
            narrate it — into a captioned, downloadable video.
          </p>
          <div className="mt-9 flex items-center gap-3">
            <Link href="/register" className="flex h-12 items-center rounded-full bg-accent px-7 text-[15px] font-medium text-white shadow-sm transition-all hover:bg-accent-hover active:scale-[0.99]">
              Get started
            </Link>
            <Link href="/login" className="flex h-12 items-center rounded-full border border-line bg-surface px-7 text-[15px] font-medium text-ink transition-colors hover:bg-fill">
              Sign in
            </Link>
          </div>
        </section>

        {/* Terminal showcase */}
        <section className="mx-auto max-w-3xl pb-8">
          <Terminal title="anemo — pipeline">
            <TypingAnimation className="text-term-fg">&gt; anemo render lecture.mp4</TypingAnimation>
            <AnimatedSpan delay={1400} className="text-term-green">✔ extracting audio</AnimatedSpan>
            <AnimatedSpan delay={2000} className="text-term-green">✔ transcribing — whisper</AnimatedSpan>
            <AnimatedSpan delay={2600} className="text-term-green">✔ segmenting concepts — 6 found</AnimatedSpan>
            <AnimatedSpan delay={3300} className="text-term-blue">▸ rendering manim scenes…</AnimatedSpan>
            <AnimatedSpan delay={4100} className="text-term-green">✔ composing 1080p60 + narration</AnimatedSpan>
            <AnimatedSpan delay={4700} className="text-term-green">✔ burning captions · loudness normalized</AnimatedSpan>
            <TypingAnimation delay={5300} className="text-term-muted">Done — 00:58 / 60s. Ready to publish.</TypingAnimation>
          </Terminal>
        </section>

        {/* Features */}
        <section className="grid gap-5 py-16 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-line bg-surface p-7 shadow-sm">
              <h3 className="text-lg font-semibold tracking-tight text-ink">{f.title}</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-subtle">{f.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-faint">
          <span>© {new Date().getFullYear()} Anemo</span>
          <span>Lecture → animation, automatically.</span>
        </div>
      </footer>
    </div>
  );
}

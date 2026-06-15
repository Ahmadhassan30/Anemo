import React from "react";
import Link from "next/link";
import { ArrowRight, Video, Brain, GraduationCap, Sparkles } from "lucide-react";

const PIPELINE = ["ingest", "transcribe", "segment", "animate", "narrate", "publish"];

const BOOT = [
  { cmd: "lectureos render --input lecture.mp4", out: null },
  { cmd: null, out: "transcribing audio ............. ok" },
  { cmd: null, out: "segmenting concepts ............ 6 found" },
  { cmd: null, out: "generating manim scenes ........ ok" },
  { cmd: null, out: "rendering 1080p60 + narration .. ok" },
  { cmd: null, out: "final cut → 00:58 / 60s ........ done" },
];

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm">
            <span className="text-primary">{"//"}</span>
            <span className="font-semibold tracking-wide text-foreground">lecture</span>
            <span className="font-semibold tracking-wide text-primary glow-text">os</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="term-link">
              sign_in
            </Link>
            <Link href="/register" className="term-btn term-btn-primary h-8 px-3 text-xs">
              get_started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 py-16 sm:px-6">
        <span className="term-chip mb-7">
          <span className="h-1.5 w-1.5 animate-blink rounded-full bg-primary" />
          autonomous 3blue1brown-style video agent
        </span>

        <h1 className="max-w-4xl text-center text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          <span className="term-prompt text-muted-foreground" />
          Turn raw lectures into{" "}
          <span className="text-primary glow-text">animated explainers</span>
          <span className="term-cursor align-middle" aria-hidden />
        </h1>

        <p className="mt-6 max-w-2xl text-center text-base leading-relaxed text-muted-foreground md:text-lg">
          A pipeline of agents transcribes the audio, segments the core concepts, generates Manim
          scenes, renders them with synchronized narration, and ships a captioned one-minute cut.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link href="/register" className="term-btn term-btn-primary px-6 py-3 text-base">
            $ create_account <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className="term-btn px-6 py-3 text-base">
            sign_in_to_dashboard
          </Link>
        </div>

        {/* Terminal session window */}
        <section className="term-window mt-16 w-full max-w-3xl pt-9 glow-ring">
          <div className="absolute right-4 top-3 text-[11px] text-muted-foreground">~/lectureos</div>
          <div className="space-y-1.5 px-5 pb-5 text-sm leading-relaxed">
            {BOOT.map((line, i) =>
              line.cmd ? (
                <p key={i} className="text-foreground">
                  <span className="text-primary">$ </span>
                  {line.cmd}
                </p>
              ) : (
                <p key={i} className="text-muted-foreground">
                  <span className="text-primary">{"› "}</span>
                  {line.out}
                </p>
              )
            )}
            <p className="pt-1 text-primary">
              ✓ pipeline complete<span className="term-cursor" aria-hidden />
            </p>
          </div>
        </section>

        {/* Pipeline strip */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2 text-xs">
          {PIPELINE.map((stage, i) => (
            <React.Fragment key={stage}>
              <span className="term-chip">{stage}</span>
              {i < PIPELINE.length - 1 && <span className="text-primary/60">{"──›"}</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Features */}
        <section className="mt-20 grid w-full grid-cols-1 gap-4 text-left md:grid-cols-3">
          {[
            {
              icon: Video,
              title: "dev-bypass uploads",
              body: "Bypasses cloud CDNs in dev mode, mirroring files to local mounts for immediate visual checks and faster iteration.",
            },
            {
              icon: Brain,
              title: "template codegen",
              body: "A premium template engine fills curated Manim scenes from tiny parameter calls — no LLM writes code, so renders never rate-limit.",
            },
            {
              icon: GraduationCap,
              title: "student RAG tutor",
              body: "Enrolled students query a chatbot grounded in lecture transcripts, with direct timestamp-linked citations.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="term-card transition-colors hover:border-primary/40">
              <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="term-caret font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-xs text-muted-foreground sm:px-6">
          <span>
            <span className="text-primary">{"//"}</span> lectureos
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            &copy; {new Date().getFullYear()} — next-gen educational animation
          </span>
        </div>
      </footer>
    </div>
  );
}

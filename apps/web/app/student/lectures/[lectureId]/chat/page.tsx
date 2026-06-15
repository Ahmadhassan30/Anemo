/*
 * Purpose: RAG chatbot for a lecture.
 */
import React from "react";

export default function StudentChatPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-12 sm:px-6">
      <div className="mb-3 flex items-center gap-2 text-xs">
        <span className="term-chip">
          <span className="h-1.5 w-1.5 animate-blink rounded-full bg-primary" />
          rag_session
        </span>
        <span className="term-chip text-muted-foreground">grounded // transcript</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
        <span className="text-primary">{"// "}</span>
        lecture_chatbot
        <span className="term-cursor align-middle" aria-hidden />
      </h1>

      <p className="term-caret mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        ask questions with timestamped citations.
      </p>

      <section className="term-window mt-8 w-full pt-9 glow-ring">
        <div className="absolute right-4 top-3 text-[11px] text-muted-foreground">~/lectureos/tutor</div>
        <div className="space-y-1.5 px-5 pb-5 text-sm leading-relaxed">
          <p className="text-muted-foreground">
            <span className="text-primary">{"› "}</span>
            transcript indexed ............. ready
          </p>
          <p className="text-foreground">
            <span className="text-primary">$ </span>
            awaiting query
            <span className="term-cursor" aria-hidden />
          </p>
        </div>
      </section>
    </main>
  );
}

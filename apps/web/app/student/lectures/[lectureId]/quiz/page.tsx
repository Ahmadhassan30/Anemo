/*
 * Purpose: Quiz page for a lecture.
 */
import React from "react";

export default function StudentQuizPage() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-zinc-950 px-4 py-12 sm:px-6">
      <section className="w-full max-w-md rounded border border-zinc-800 bg-zinc-900 p-8 text-center">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500">
          knowledge_check
        </span>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-100">
          Quiz
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">
          Test your understanding of the lecture.
        </p>
        <p className="mt-6 font-mono text-sm text-zinc-600">
          $ quiz will appear here
        </p>
      </section>
    </main>
  );
}

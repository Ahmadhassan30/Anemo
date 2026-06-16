/*
 * Purpose: RAG chatbot for a lecture.
 */
import React from "react";

export default function StudentChatPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-sm">
        <span className="pill bg-positive/10 text-positive">
          <span className="h-1.5 w-1.5 rounded-full bg-positive" />
          rag · grounded in transcript
        </span>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">
          Lecture chat
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-subtle">
          Ask questions about this lecture and get answers with timestamped
          citations, grounded in the transcript.
        </p>

        <p className="mt-6 font-mono text-sm text-faint">
          → open a lecture to chat
        </p>
      </div>
    </main>
  );
}

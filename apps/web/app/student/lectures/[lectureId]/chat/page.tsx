/*
 * Purpose: RAG chatbot for a lecture.
 */
import React from "react";

export default function StudentChatPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md rounded border border-zinc-800 bg-zinc-900 p-8">
        <span className="inline-flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          rag · grounded in transcript
        </span>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-100">
          Lecture chat
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-zinc-500">
          Ask questions about this lecture and get answers with timestamped
          citations, grounded in the transcript.
        </p>

        <p className="mt-6 font-mono text-sm text-zinc-600">
          $ open a lecture to chat
        </p>
      </div>
    </main>
  );
}

/*
 * Purpose: Professor dashboard overview.
 */
import React from "react";
import Link from "next/link";

export default function ProfessorDashboardPage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <header className="px-8 py-12">
        <h1 className="text-3xl font-light text-zinc-100">Good morning</h1>
        <p className="mt-1 font-mono text-sm text-zinc-500">
          your rendered lectures will appear here
        </p>
      </header>

      <div className="flex flex-col items-center justify-center gap-6 px-8 py-24">
        <p className="font-mono text-sm text-zinc-600">
          $ no lectures yet — upload your first one
        </p>
        <Link
          href="/professor/upload"
          className="rounded bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-indigo-400"
        >
          Upload lecture →
        </Link>
      </div>

      <Link
        href="/professor/upload"
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500 text-xl text-white transition-colors duration-150 hover:bg-indigo-400"
        aria-label="Upload lecture"
      >
        +
      </Link>
    </main>
  );
}

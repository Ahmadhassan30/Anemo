/*
 * Purpose: Professor dashboard overview.
 */
import React from "react";
import Link from "next/link";

export default function ProfessorDashboardPage() {
  return (
    <main className="bg-zinc-950 min-h-screen">
      {/* Header */}
      <div className="py-12 px-8">
        <h1 className="text-3xl font-light text-zinc-100">Good morning</h1>
        <p className="text-zinc-500 text-sm mt-1 font-mono">
          0 lectures · 0 concepts rendered
        </p>
      </div>

      {/* Empty State */}
      <div className="px-8">
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-zinc-600 font-mono text-sm">
            $ no lectures yet — upload your first one
          </p>
          <Link
            href="/professor/upload"
            className="mt-6 bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-sm px-6 py-2.5 rounded transition-colors duration-150"
          >
            Upload lecture →
          </Link>
        </div>
      </div>

      {/* FAB */}
      <Link
        href="/professor/upload"
        className="fixed bottom-8 right-8 w-12 h-12 bg-indigo-500 hover:bg-indigo-400 rounded-full text-white text-xl flex items-center justify-center transition-colors duration-150"
      >
        +
      </Link>
    </main>
  );
}

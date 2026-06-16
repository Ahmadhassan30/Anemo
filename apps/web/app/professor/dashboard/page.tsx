/*
 * Purpose: Professor dashboard overview.
 */
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ProfessorDashboardPage() {
  return (
    <main className="min-h-screen bg-canvas">
      <header className="mx-auto max-w-5xl px-8 pb-8 pt-16">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Good morning</h1>
        <p className="mt-2 text-subtle">Your rendered lectures will appear here.</p>
      </header>

      <div className="mx-auto max-w-5xl px-8 pb-24">
        <Card className="flex flex-col items-center justify-center gap-6 px-8 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-fill text-2xl text-subtle">
            ▸
          </div>
          <div className="space-y-1.5">
            <p className="text-lg font-medium text-ink">No lectures yet</p>
            <p className="text-sm text-subtle">
              Upload your first lecture to get started.
            </p>
          </div>
          <Button asChild>
            <Link href="/professor/upload">Upload lecture →</Link>
          </Button>
        </Card>
      </div>

      <Link
        href="/professor/upload"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-white shadow-sm transition-all duration-200 hover:bg-accent-hover active:scale-[0.98]"
        aria-label="Upload lecture"
      >
        +
      </Link>
    </main>
  );
}

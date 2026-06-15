/*
 * Purpose: Professor dashboard overview.
 */
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProfessorDashboardPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="term-label mb-2">{"// professor"}</p>
          <h1 className="term-prompt text-3xl font-bold tracking-tight text-foreground">
            dashboard
            <span className="term-cursor align-middle" aria-hidden />
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            overview of lectures, pipeline status, and analytics.
          </p>
        </div>
        <Link href="/professor/upload">
          <Button className="term-btn term-btn-primary h-9 px-4 text-xs">
            $ new_lecture
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
        <span className="term-chip">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
          lectures: 0
        </span>
        <span className="term-chip">
          <span className="h-1.5 w-1.5 rounded-full bg-term-amber" />
          pipeline: idle
        </span>
        <span className="term-chip">
          <span className="h-1.5 w-1.5 animate-blink rounded-full bg-primary" />
          ready
        </span>
      </div>

      <section className="term-window pt-9">
        <div className="absolute right-4 top-3 text-[11px] text-muted-foreground">~/lectures</div>
        <div className="px-6 pb-10 pt-2 text-center">
          <p className="text-muted-foreground">
            <span className="text-primary">{"› "}</span>
            no lectures found
          </p>
          <h2 className="term-caret mt-4 text-xl font-semibold text-foreground">
            queue is empty
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            upload a video lecture to start concept extraction and animation.
          </p>
          <div className="mt-7 flex justify-center">
            <Link href="/professor/upload">
              <Button
                variant="outline"
                className="term-btn px-5 py-2 text-sm"
              >
                $ upload_first_lecture
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

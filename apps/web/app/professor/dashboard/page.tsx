/*
 * Purpose: Professor dashboard overview.
 */
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProfessorDashboardPage() {
  return (
    <main className="container max-w-4xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-400 mt-2">Overview of lectures, pipeline status, and analytics.</p>
        </div>
        <Link href="/professor/upload">
          <Button className="bg-blue-600 hover:bg-blue-500 text-white">
            + New Lecture
          </Button>
        </Link>
      </div>

      <div className="bg-[#0f1117] border border-slate-800 rounded-lg p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-200 mb-2">No Lectures Yet</h2>
        <p className="text-slate-400 mb-6">Upload a video lecture to get started with concept extraction and animation.</p>
        <Link href="/professor/upload">
          <Button variant="outline" className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white">
            Upload Your First Lecture
          </Button>
        </Link>
      </div>
    </main>
  );
}

/*
 * Purpose: Layout wrapper for professor portal pages.
 */
import React from "react";

export default function ProfessorLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans">
      <header className="border-b border-slate-800 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center font-bold text-white">
              L
            </div>
            <h1 className="font-semibold text-lg tracking-tight text-white">LectureOS</h1>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-800 text-xs font-medium text-slate-300">
              Professor Portal
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <a href="/professor/dashboard" className="text-slate-300 hover:text-white transition-colors">Dashboard</a>
            <a href="/professor/upload" className="text-slate-300 hover:text-white transition-colors">Upload</a>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

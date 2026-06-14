import React from "react";
import Link from "next/link";
import { ArrowRight, Video, Sparkles, Brain, GraduationCap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 h-[500px] w-[800px] rounded-full bg-gradient-to-r from-teal-500/10 to-indigo-500/10 blur-[150px]" />
      
      {/* Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
              LectureOS
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-20 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-500/5 text-xs text-teal-300 font-semibold mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          Autonomous 3Blue1Brown-style Video Agent
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
          Transform Raw Lectures Into{" "}
          <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            Beautiful Animations
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed">
          LectureOS transcribes your lecture, segments core concepts, generates 
          Manim code, renders visual scenes, and publishes fully synchronized 
          videos.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 px-8 py-4 text-base font-semibold hover:brightness-110 transition-all shadow-xl shadow-teal-500/10"
          >
            Create Free Account
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950/40 px-8 py-4 text-base font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-all backdrop-blur-sm"
          >
            Sign In to Dashboard
          </Link>
        </div>

        {/* Features Grid */}
        <section className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 text-left w-full">
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-8 backdrop-blur-sm">
            <div className="h-12 w-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-6">
              <Video className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Dev-Bypass Uploads</h3>
            <p className="mt-3 text-slate-400 text-sm leading-relaxed">
              Bypasses cloud CDNs in dev mode, mirroring files directly to local mounts 
              for immediate visual checking and faster iteration.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-8 backdrop-blur-sm">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">AI Code Generation</h3>
            <p className="mt-3 text-slate-400 text-sm leading-relaxed">
              A robust Planner-Coder-Critic system translates transcribed concepts into 
              syntactically correct Python Manim script rendering.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-8 backdrop-blur-sm">
            <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Interactive Student RAG</h3>
            <p className="mt-3 text-slate-400 text-sm leading-relaxed">
              Enrolled students can interact with a specialized chatbot grounded in 
              lecture transcripts, offering direct timestamp-linked citation links.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-600">
          &copy; {new Date().getFullYear()} LectureOS. Built for Next-Gen Educational Animations.
        </div>
      </footer>
    </div>
  );
}

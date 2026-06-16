/*
 * Purpose: Professor settings and YouTube OAuth connection.
 */
import React from "react";

export default function ProfessorSettingsPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-8 py-12">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-100">Settings</h1>

      <section className="mb-8">
        <p className="mb-3 text-[10px] uppercase tracking-widest text-zinc-500">YouTube Connection</p>
        <div className="rounded border border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 last:border-0">
            <span className="text-sm text-zinc-300">Status</span>
            <span className="pill bg-zinc-800 text-zinc-400 border-zinc-700">○ not_connected</span>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 last:border-0">
            <span className="text-sm text-zinc-300">OAuth</span>
            <span className="font-mono text-sm text-zinc-500">link to publish rendered cuts</span>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <p className="mb-3 text-[10px] uppercase tracking-widest text-zinc-500">Profile</p>
        <div className="rounded border border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 last:border-0">
            <span className="text-sm text-zinc-300">Role</span>
            <span className="font-mono text-sm text-zinc-500">professor</span>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 last:border-0">
            <span className="text-sm text-zinc-300">Preferences</span>
            <span className="font-mono text-sm text-zinc-500">default</span>
          </div>
        </div>
      </section>
    </main>
  );
}

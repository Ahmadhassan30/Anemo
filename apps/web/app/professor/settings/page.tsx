/*
 * Purpose: Professor settings and YouTube OAuth connection.
 */
import React from "react";

export default function ProfessorSettingsPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-8 py-14">
      <h1 className="mb-10 text-3xl font-semibold tracking-tight text-ink">Settings</h1>

      <section className="mb-10">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-faint">
          YouTube Connection
        </p>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-line px-5 py-4 last:border-0">
            <span className="text-sm text-ink">Status</span>
            <span className="pill bg-fill text-subtle">○ not_connected</span>
          </div>
          <div className="flex items-center justify-between border-b border-line px-5 py-4 last:border-0">
            <span className="text-sm text-ink">OAuth</span>
            <span className="text-sm text-subtle">link to publish rendered cuts</span>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-faint">
          Profile
        </p>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-line px-5 py-4 last:border-0">
            <span className="text-sm text-ink">Role</span>
            <span className="text-sm text-subtle">professor</span>
          </div>
          <div className="flex items-center justify-between border-b border-line px-5 py-4 last:border-0">
            <span className="text-sm text-ink">Preferences</span>
            <span className="text-sm text-subtle">default</span>
          </div>
        </div>
      </section>
    </main>
  );
}

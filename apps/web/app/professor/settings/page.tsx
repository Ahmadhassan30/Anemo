/*
 * Purpose: Professor settings and YouTube OAuth connection.
 */
import React from "react";

export default function ProfessorSettingsPage() {
  return (
    <main className="max-w-xl mx-auto py-12 px-8">
      <h1 className="text-2xl font-semibold text-zinc-100 mb-8">Settings</h1>

      {/* Profile */}
      <div className="mb-8">
        <span className="uppercase tracking-widest text-[10px] text-zinc-500 mb-3 block">
          Profile
        </span>
        <div className="bg-zinc-900 border border-zinc-800 rounded">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-zinc-300 text-sm">Role</span>
            <span className="text-zinc-500 text-sm font-mono">professor</span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-zinc-300 text-sm">Account</span>
            <span className="text-zinc-500 text-sm font-mono">active</span>
          </div>
        </div>
      </div>

      {/* YouTube Connection */}
      <div className="mb-8">
        <span className="uppercase tracking-widest text-[10px] text-zinc-500 mb-3 block">
          YouTube Connection
        </span>
        <div className="bg-zinc-900 border border-zinc-800 rounded">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-zinc-300 text-sm">Status</span>
            <span className="pill bg-yellow-950 text-yellow-300 border-yellow-800">
              not connected
            </span>
          </div>
          <div className="px-4 py-3">
            <p className="text-zinc-500 text-sm">
              Link a YouTube account via OAuth to publish rendered videos directly from the pipeline.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div>
        <span className="uppercase tracking-widest text-[10px] text-zinc-500 mb-3 block">
          Danger Zone
        </span>
        <div className="bg-zinc-900 border border-zinc-800 rounded">
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-zinc-300 text-sm">Delete account</span>
            <button className="border border-red-800 text-red-400 hover:bg-red-950 text-xs px-3 py-1.5 rounded transition-colors duration-150">
              Delete
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

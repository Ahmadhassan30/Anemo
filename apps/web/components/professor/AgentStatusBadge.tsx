import { cn } from "@/lib/utils";

export type AgentStatus = "pending" | "started" | "running" | "success" | "done" | "failed" | "retrying" | "completed";

interface AgentStatusBadgeProps {
  status: AgentStatus | string;
  className?: string;
}

const STATUS_MAP: Record<string, { classes: string; label: string }> = {
  completed: {
    classes: "bg-green-950 text-green-400 border-green-800",
    label: "completed",
  },
  done: {
    classes: "bg-green-950 text-green-400 border-green-800",
    label: "completed",
  },
  success: {
    classes: "bg-green-950 text-green-400 border-green-800",
    label: "completed",
  },
  running: {
    classes: "bg-yellow-950 text-yellow-300 border-yellow-800 animate-pulse",
    label: "running",
  },
  started: {
    classes: "bg-yellow-950 text-yellow-300 border-yellow-800 animate-pulse",
    label: "running",
  },
  retrying: {
    classes: "bg-yellow-950 text-yellow-300 border-yellow-800 animate-pulse",
    label: "retrying",
  },
  failed: {
    classes: "bg-red-950 text-red-400 border-red-800",
    label: "failed",
  },
  pending: {
    classes: "bg-zinc-800 text-zinc-400 border-zinc-700",
    label: "pending",
  },
};

export function AgentStatusBadge({ status, className }: AgentStatusBadgeProps) {
  const key = status.toLowerCase();
  const config = STATUS_MAP[key] || STATUS_MAP.pending;

  return (
    <span className={cn("pill", config.classes, className)}>
      {config.label}
    </span>
  );
}

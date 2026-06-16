import { cn } from "@/lib/utils";

export type AgentStatus = "pending" | "started" | "running" | "success" | "done" | "failed" | "retrying";

interface AgentStatusBadgeProps {
  status: AgentStatus;
  className?: string;
}

export function AgentStatusBadge({ status, className }: AgentStatusBadgeProps) {
  // Normalize backend enum variations to our visual states.
  let visualStatus = status.toLowerCase();
  if (visualStatus === "started") visualStatus = "running";
  if (visualStatus === "success") visualStatus = "done";

  const styles: Record<string, string> = {
    pending: "bg-zinc-800 text-zinc-400 border-zinc-700",
    running: "bg-yellow-950 text-yellow-300 border-yellow-800 animate-pulse",
    retrying: "bg-yellow-950 text-yellow-300 border-yellow-800 animate-pulse",
    done: "bg-green-950 text-green-400 border-green-800",
    failed: "bg-red-950 text-red-400 border-red-800",
  };

  const labels: Record<string, string> = {
    pending: "pending",
    running: "running",
    retrying: "retrying",
    done: "completed",
    failed: "failed",
  };

  const style = styles[visualStatus] || styles.pending;
  const label = labels[visualStatus] || visualStatus;

  return <span className={cn("pill", style, className)}>{label}</span>;
}

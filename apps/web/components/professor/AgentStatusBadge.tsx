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
    pending: "bg-fill text-subtle",
    running: "bg-accent/10 text-accent",
    retrying: "bg-warning/10 text-warning",
    done: "bg-positive/10 text-positive",
    failed: "bg-danger/10 text-danger",
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

  return (
    <span className={cn("pill", style, className)}>
      {visualStatus === "running" && (
        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
      )}
      {label}
    </span>
  );
}

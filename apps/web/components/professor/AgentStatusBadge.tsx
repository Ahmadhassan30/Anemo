import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AgentStatus = "pending" | "started" | "running" | "success" | "done" | "failed" | "retrying";

interface AgentStatusBadgeProps {
  status: AgentStatus;
  className?: string;
}

export function AgentStatusBadge({ status, className }: AgentStatusBadgeProps) {
  // Normalize variations from backend enum to our frontend visual states
  let visualStatus = status.toLowerCase();
  if (visualStatus === "started") visualStatus = "running";
  if (visualStatus === "success") visualStatus = "done";

  const statusStyles: Record<string, string> = {
    pending: "bg-slate-800 text-slate-300 hover:bg-slate-800",
    running: "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20",
    done: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20",
    failed: "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/20",
    retrying: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20",
  };

  const currentStyle = statusStyles[visualStatus] || statusStyles.pending;
  const isPulsing = visualStatus === "running";

  return (
    <Badge variant="secondary" className={cn("capitalize font-medium flex gap-2 items-center px-2.5 py-0.5", currentStyle, className)}>
      {isPulsing && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
      )}
      {visualStatus}
    </Badge>
  );
}

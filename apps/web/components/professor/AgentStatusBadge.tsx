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

  // Hairline-bordered chip styles per state — ink-on-near-black with restrained accents.
  const statusStyles: Record<string, string> = {
    pending: "border-border bg-secondary text-muted-foreground",
    running: "border-term-cyan/40 bg-term-cyan/10 text-term-cyan",
    done: "border-primary/40 bg-primary/10 text-primary",
    failed: "border-destructive/40 bg-destructive/10 text-destructive",
    retrying: "border-term-amber/40 bg-term-amber/10 text-term-amber",
  };

  // Colored status dot per state.
  const dotStyles: Record<string, string> = {
    pending: "bg-muted-foreground",
    running: "bg-term-cyan",
    done: "bg-primary",
    failed: "bg-destructive",
    retrying: "bg-term-amber",
  };

  // Terminal-voice label per state.
  const statusLabels: Record<string, string> = {
    pending: "pending",
    running: "running",
    done: "ok",
    failed: "failed",
    retrying: "retry",
  };

  const currentStyle = statusStyles[visualStatus] || statusStyles.pending;
  const currentDot = dotStyles[visualStatus] || dotStyles.pending;
  const currentLabel = statusLabels[visualStatus] || visualStatus;
  const isPulsing = visualStatus === "running";

  return (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-1.5 rounded-sm px-2 py-0.5 font-mono lowercase tracking-tight",
        currentStyle,
        className
      )}
    >
      <span className="select-none opacity-50">[</span>
      {isPulsing ? (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-term-cyan opacity-75"></span>
          <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", currentDot)}></span>
        </span>
      ) : (
        <span className={cn("inline-flex h-1.5 w-1.5 rounded-full", currentDot)}></span>
      )}
      {currentLabel}
      <span className="select-none opacity-50">]</span>
    </Badge>
  );
}

/*
 * Purpose: Status badge for a single agent stage.
 */
import React from "react";

export type AgentStatusBadgeProps = {
  label: string;
  status: string;
};

export function AgentStatusBadge({ label, status }: AgentStatusBadgeProps) {
  return (
    <span>
      {label}: {status}
    </span>
  );
}

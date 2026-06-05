/*
 * Purpose: Layout wrapper for student portal pages.
 */
import React from "react";

export default function StudentLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      <header>
        <h1>Student Portal</h1>
      </header>
      <div>{children}</div>
    </section>
  );
}

/*
 * Purpose: Layout wrapper for professor portal pages.
 */
import React from "react";

export default function ProfessorLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      <header>
        <h1>Professor Portal</h1>
      </header>
      <div>{children}</div>
    </section>
  );
}

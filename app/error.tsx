"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
    >
      <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--color-yellow)" }}>
        Something went wrong
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
        {error.message}
      </p>
      <button
        onClick={reset}
        className="text-sm px-4 py-2 rounded-lg font-medium text-black"
        style={{ backgroundColor: "var(--color-yellow)" }}
      >
        Try again
      </button>
    </div>
  );
}

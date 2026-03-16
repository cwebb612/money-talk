import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
    >
      <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--color-yellow)" }}>
        404
      </h1>
      <p className="mb-6" style={{ color: "var(--color-muted)" }}>
        Page not found
      </p>
      <Link
        href="/"
        className="text-sm px-4 py-2 rounded-lg font-medium text-black"
        style={{ backgroundColor: "var(--color-yellow)" }}
      >
        Go Home
      </Link>
    </div>
  );
}

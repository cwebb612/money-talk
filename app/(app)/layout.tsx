"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg)" }}>
      <nav
        className="flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: "var(--color-card)", borderBottom: "1px solid var(--color-blue)" }}
      >
        <Link
          href="/"
          className="text-lg font-bold"
          style={{ color: "var(--color-yellow)" }}
        >
          Money Talk
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/accounts/new"
            className="text-sm px-3 py-1 rounded-lg font-medium text-black"
            style={{ backgroundColor: "var(--color-yellow)" }}
          >
            + Add Account
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm"
            style={{ color: "var(--color-muted)" }}
          >
            Sign Out
          </button>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}

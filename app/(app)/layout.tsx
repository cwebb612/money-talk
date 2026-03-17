"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Heart, Moon, User, Users, Key, SquareArrowRight } from "lucide-react";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("theme") as "dark" | "light") ?? "dark";
  });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const isDark = theme === "dark";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg)" }}>
      <nav
        className="flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: "var(--color-card)", borderBottom: "1px solid var(--color-border)" }}
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

          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center justify-center rounded-full"
              style={{
                width: 32,
                height: 32,
                border: "1px solid var(--color-border)",
                backgroundColor: menuOpen ? "var(--color-border)" : "transparent",
                color: "var(--color-muted)",
                cursor: "pointer",
              }}
              aria-label="Account menu"
            >
              <User />
            </button>

            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  minWidth: 180,
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                  overflow: "hidden",
                  zIndex: 50,
                }}
              >
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 w-full text-left text-sm px-4 py-3"
                  style={{ color: "var(--color-text)", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-border)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  {isDark ? <Heart /> : <Moon />}
                  {isDark ? "Pink Mode" : "Dark Mode"}
                </button>

                <div style={{ borderTop: "1px solid var(--color-border)" }} />

                <Link
                  href="/users"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 w-full text-left text-sm px-4 py-3"
                  style={{
                    color: pathname === "/users" ? "var(--color-yellow)" : "var(--color-text)",
                    cursor: "pointer",
                    textDecoration: "none",
                    display: "flex",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-border)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Users />
                  Users
                </Link>

                <Link
                  href="/api-keys"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 w-full text-left text-sm px-4 py-3"
                  style={{
                    color: pathname === "/api-keys" ? "var(--color-yellow)" : "var(--color-text)",
                    cursor: "pointer",
                    textDecoration: "none",
                    display: "flex",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-border)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Key />
                  API Keys
                </Link>

                <div style={{ borderTop: "1px solid var(--color-border)" }} />

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-left text-sm px-4 py-3"
                  style={{ color: "var(--color-muted)", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-border)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <SquareArrowRight />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}

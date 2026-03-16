"use client";

import { useEffect, useState } from "react";

interface ApiKey {
  _id: string;
  name: string;
  key: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadKeys() {
    const res = await fetch("/api/keys");
    if (res.ok) setKeys(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadKeys(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (!res.ok) {
      setError("Failed to create key.");
      return;
    }
    const created = await res.json();
    setNewKeyValue(created.key);
    setNewName("");
    setCreating(false);
    setKeys((prev) => [
      { _id: created._id, name: created.name, key: created.key, prefix: created.prefix, createdAt: created.createdAt, lastUsedAt: null },
      ...prev,
    ]);
  }

  async function handleDelete(id: string) {
    if (!confirm("Revoke this API key? Any app using it will lose access immediately.")) return;
    const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
    if (res.ok) setKeys((prev) => prev.filter((k) => k._id !== id));
    else setError("Failed to revoke key.");
    setDeletingId(null);
  }

  async function handleCopy() {
    if (!newKeyValue) return;
    await navigator.clipboard.writeText(newKeyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCopyKey(id: string, key: string) {
    await navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            API Keys
          </h1>
          <p style={{ color: "var(--color-muted)", fontSize: "0.875rem", marginTop: 4 }}>
            Use these keys to access the{" "}
            <a href="/api-doc" target="_blank" rel="noreferrer" style={{ color: "var(--color-yellow)" }}>
              Money Talk API
            </a>
            .
          </p>
        </div>
        {!creating && (
          <button
            onClick={() => { setCreating(true); setNewKeyValue(null); setError(null); }}
            className="text-sm px-3 py-1 rounded-lg font-medium text-black"
            style={{ backgroundColor: "var(--color-yellow)", cursor: "pointer" }}
          >
            + New Key
          </button>
        )}
      </div>

      {newKeyValue && (
        <div
          style={{
            backgroundColor: "#052e16",
            border: "1px solid #166534",
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 24,
          }}
        >
          <p style={{ fontSize: "0.8rem", color: "#86efac", marginBottom: 8, fontWeight: 600 }}>
            Key created.
          </p>
          <div className="flex items-center gap-2">
            <code
              style={{
                flex: 1,
                fontFamily: "monospace",
                fontSize: "0.8rem",
                color: "#4ade80",
                wordBreak: "break-all",
                backgroundColor: "#021a0c",
                padding: "8px 12px",
                borderRadius: 6,
              }}
            >
              {newKeyValue}
            </code>
            <button
              onClick={handleCopy}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                backgroundColor: copied ? "#166534" : "#15803d",
                color: "#fff",
                fontSize: "0.75rem",
                cursor: "pointer",
                flexShrink: 0,
                border: "none",
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {creating && (
        <form
          onSubmit={handleCreate}
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 24,
          }}
        >
          <label style={{ display: "block", fontSize: "0.8rem", color: "var(--color-muted)", marginBottom: 6 }}>
            Key name
          </label>
          <div className="flex gap-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Home automation"
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-bg)",
                color: "var(--color-text)",
                fontSize: "0.875rem",
              }}
            />
            <button
              type="submit"
              className="text-sm px-3 py-1 rounded-lg font-medium text-black"
              style={{ backgroundColor: "var(--color-yellow)", cursor: "pointer" }}
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => { setCreating(false); setNewName(""); }}
              style={{ fontSize: "0.875rem", color: "var(--color-muted)", cursor: "pointer", background: "none", border: "none" }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && (
        <p style={{ color: "#f87171", fontSize: "0.875rem", marginBottom: 16 }}>{error}</p>
      )}

      {loading ? (
        <p style={{ color: "var(--color-muted)", fontSize: "0.875rem" }}>Loading…</p>
      ) : keys.length === 0 ? (
        <div
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            padding: "32px 20px",
            textAlign: "center",
            color: "var(--color-muted)",
            fontSize: "0.875rem",
          }}
        >
          No API keys yet. Create one to start using the API.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {keys.map((key) => (
            <div
              key={key._id}
              style={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 10,
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "0.9rem" }}>
                  {key.name}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: 2, fontFamily: "monospace" }}>
                  {key.prefix}…
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                  Created {formatDate(key.createdAt)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                  Last used {formatDate(key.lastUsedAt)}
                </div>
              </div>
              <div className="flex gap-2" style={{ flexShrink: 0 }}>
                <button
                  onClick={() => handleCopyKey(key._id, key.key)}
                  style={{
                    fontSize: "0.75rem",
                    color: copiedId === key._id ? "var(--color-muted)" : "var(--color-text)",
                    cursor: "pointer",
                    background: "none",
                    border: "1px solid var(--color-border)",
                    borderRadius: 6,
                    padding: "4px 10px",
                  }}
                >
                  {copiedId === key._id ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={() => handleDelete(key._id)}
                  disabled={deletingId === key._id}
                  style={{
                    fontSize: "0.75rem",
                    color: "#ef4444",
                    cursor: "pointer",
                    background: "none",
                    border: "1px solid #ef4444",
                    borderRadius: 6,
                    padding: "4px 10px",
                  }}
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

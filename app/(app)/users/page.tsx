"use client";

import { useEffect, useState } from "react";

interface User {
  _id: string;
  username: string;
  createdAt: string;
  lastLoginAt: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [creating, setCreating] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Edit form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");

  async function loadUsers() {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setCurrentUserId(data.currentUserId);
    }
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUsername.trim(), password: newPassword }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create user.");
      return;
    }
    const created = await res.json();
    setUsers((prev) => [...prev, created]);
    setNewUsername("");
    setNewPassword("");
    setCreating(false);
  }

  function startEdit(user: User) {
    setEditingId(user._id);
    setEditUsername(user.username);
    setEditPassword("");
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditUsername("");
    setEditPassword("");
  }

  async function handleUpdate(e: React.FormEvent, id: string) {
    e.preventDefault();
    setError(null);
    const body: Record<string, string> = {};
    if (editUsername.trim()) body.username = editUsername.trim();
    if (editPassword) body.password = editPassword;

    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to update user.");
      return;
    }
    const updated = await res.json();
    setUsers((prev) => prev.map((u) => (u._id === id ? updated : u)));
    cancelEdit();
  }

  async function handleDelete(id: string, username: string) {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to delete user.");
    }
  }

  const inputStyle = {
    flex: 1,
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid var(--color-border)",
    backgroundColor: "var(--color-bg)",
    color: "var(--color-text)",
    fontSize: "0.875rem",
    minWidth: 0,
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 32 }}>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
          Users
        </h1>
        {!creating && (
          <button
            onClick={() => { setCreating(true); setError(null); }}
            className="text-sm px-3 py-1 rounded-lg font-medium text-black"
            style={{ backgroundColor: "var(--color-yellow)", cursor: "pointer" }}
          >
            + New User
          </button>
        )}
      </div>

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
          <div style={{ fontSize: "0.8rem", color: "var(--color-muted)", marginBottom: 10 }}>
            New user
          </div>
          <div className="flex gap-2" style={{ marginBottom: 8 }}>
            <input
              autoFocus
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Username"
              style={inputStyle}
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Password"
              style={inputStyle}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="text-sm px-3 py-1 rounded-lg font-medium text-black"
              style={{ backgroundColor: "var(--color-yellow)", cursor: "pointer" }}
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => { setCreating(false); setNewUsername(""); setNewPassword(""); }}
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
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {users.map((user) => (
            <div
              key={user._id}
              style={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {editingId === user._id ? (
                <form
                  onSubmit={(e) => handleUpdate(e, user._id)}
                  style={{ padding: "14px 20px" }}
                >
                  <div style={{ fontSize: "0.8rem", color: "var(--color-muted)", marginBottom: 10 }}>
                    Editing {user.username}
                  </div>
                  <div className="flex gap-2" style={{ marginBottom: 8 }}>
                    <input
                      autoFocus
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="Username"
                      style={inputStyle}
                    />
                    <input
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="New password (leave blank to keep)"
                      style={inputStyle}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="text-sm px-3 py-1 rounded-lg font-medium text-black"
                      style={{ backgroundColor: "var(--color-yellow)", cursor: "pointer" }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      style={{ fontSize: "0.875rem", color: "var(--color-muted)", cursor: "pointer", background: "none", border: "none" }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  style={{
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "0.9rem" }}>
                        {user.username}
                      </span>
                      {user._id === currentUserId && (
                        <span
                          style={{
                            fontSize: "0.65rem",
                            padding: "2px 6px",
                            borderRadius: 4,
                            backgroundColor: "var(--color-border)",
                            color: "var(--color-muted)",
                            fontWeight: 500,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          You
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: 2 }}>
                      Joined {formatDate(user.createdAt)} · Last login {formatDate(user.lastLoginAt)}
                    </div>
                  </div>
                  <div className="flex gap-2" style={{ flexShrink: 0 }}>
                    <button
                      onClick={() => startEdit(user)}
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-text)",
                        cursor: "pointer",
                        background: "none",
                        border: "1px solid var(--color-border)",
                        borderRadius: 6,
                        padding: "4px 10px",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user._id, user.username)}
                      disabled={user._id === currentUserId}
                      title={user._id === currentUserId ? "Cannot delete your own account" : undefined}
                      style={{
                        fontSize: "0.75rem",
                        color: user._id === currentUserId ? "var(--color-border)" : "#ef4444",
                        cursor: user._id === currentUserId ? "not-allowed" : "pointer",
                        background: "none",
                        border: `1px solid ${user._id === currentUserId ? "var(--color-border)" : "#ef4444"}`,
                        borderRadius: 6,
                        padding: "4px 10px",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

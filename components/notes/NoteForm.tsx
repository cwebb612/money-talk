"use client";

import { useId, useState } from "react";
import { Trash2 } from "lucide-react";
import Button from "../ui/Button";
import Popconfirm from "../ui/Popconfirm";
import Select from "../ui/Select";
import PillToggle from "../ui/PillToggle";
import { AccountOption } from "../accounts/useAccountOptions";
import { NOTE_MAX_LENGTH } from "../../lib/utils/notes";
import { todayString } from "../../lib/utils/filters";

const DATE_MODES = [
  { value: "dated", label: "On a date" },
  { value: "undated", label: "No date" },
];

const fieldHeaderClass = "flex items-center gap-3 h-6 mb-1.5";
const fieldHintClass = "text-xs mt-1.5";

export interface NoteFormValues {
  body: string;
  date: string | null;
  accountId?: string | null;
}

interface NoteFormProps {
  initial?: Partial<NoteFormValues>;
  accounts?: AccountOption[];
  submitLabel?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSubmit: (values: NoteFormValues) => Promise<void>;
  onCancel?: () => void;
  onDelete?: () => Promise<void>;
}

export default function NoteForm({
  initial,
  accounts,
  submitLabel = "Save",
  placeholder = "Write a note…",
  autoFocus = false,
  onSubmit,
  onCancel,
  onDelete,
}: NoteFormProps) {
  const [body, setBody] = useState(initial?.body ?? "");
  const [date, setDate] = useState(initial?.date ?? todayString());
  const [undated, setUndated] = useState(!initial?.date);
  const [accountId, setAccountId] = useState(initial?.accountId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dateInputId = useId();
  const accountSelectId = useId();

  const canSave = body.trim().length > 0 && (undated || date !== "") && !saving;

  async function submit() {
    if (!canSave) return;
    setError("");
    setSaving(true);
    try {
      await onSubmit({
        body: body.trim(),
        date: undated ? null : date,
        ...(accounts ? { accountId: accountId || null } : {}),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape" && onCancel) onCancel();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-4"
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={NOTE_MAX_LENGTH}
        placeholder={placeholder}
        aria-label="Note"
        autoFocus={autoFocus}
        rows={3}
        className="outline-none border border-[var(--color-border)] focus:border-[var(--color-blue)] transition-colors"
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: 8,
          backgroundColor: "var(--color-bg)",
          color: "var(--color-text)",
          fontSize: "0.875rem",
          resize: "vertical",
        }}
      />

      <div className={`grid grid-cols-1 gap-4 ${accounts ? "desktop:grid-cols-2" : ""}`}>
        <div>
          <div className={fieldHeaderClass}>
            <label htmlFor={dateInputId} className="text-xs" style={{ color: "var(--color-muted)" }}>
              Date
            </label>
            <PillToggle
              ariaLabel="Date"
              value={undated ? "undated" : "dated"}
              options={DATE_MODES}
              onChange={(mode) => setUndated(mode === "undated")}
            />
          </div>
          <div
            className="relative rounded-lg transition-[border-color,background-color] duration-150"
            style={{
              border: `1px ${undated ? "dashed" : "solid"} ${undated ? "var(--color-border)" : "var(--color-muted)"}`,
              backgroundColor: undated ? "transparent" : "var(--color-card)",
            }}
          >
            <input
              id={dateInputId}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={undated}
              aria-hidden={undated}
              tabIndex={undated ? -1 : undefined}
              className="block w-full px-4 py-2 rounded-lg bg-transparent outline-none text-sm transition-opacity duration-150"
              style={{ color: "var(--color-text)", opacity: undated ? 0 : 1 }}
            />
            <div
              aria-hidden={!undated}
              className="absolute inset-0 flex items-center px-4 text-sm transition-opacity duration-150"
              style={{ opacity: undated ? 1 : 0, pointerEvents: "none", color: "var(--color-muted)" }}
            >
              No date
            </div>
          </div>
          <p className={fieldHintClass} style={{ color: "var(--color-muted)" }}>
            {undated ? "Not shown on the chart." : "Shows on the net worth chart."}
          </p>
        </div>

        {accounts && (
          <div>
            <div className={fieldHeaderClass}>
              <label htmlFor={accountSelectId} className="text-xs" style={{ color: "var(--color-muted)" }}>
                Account
              </label>
            </div>
            <Select
              id={accountSelectId}
              value={accountId}
              onChange={setAccountId}
              options={[
                { value: "", label: "No account" },
                ...accounts.map((account) => ({ value: account._id, label: account.name })),
              ]}
            />
            <p className={fieldHintClass} style={{ color: "var(--color-muted)" }}>
              {accountId ? "Also shows on the account page." : "Not linked to an account."}
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={!canSave} className="py-1.5">
          {saving ? "Saving…" : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="py-1.5">
            Cancel
          </Button>
        )}
        {body.length > NOTE_MAX_LENGTH * 0.9 && (
          <span className="text-xs" style={{ color: "var(--color-muted)" }}>
            {body.length}/{NOTE_MAX_LENGTH}
          </span>
        )}
        {onDelete && (
          <div className="ml-auto">
            <Popconfirm title="Delete this note?" onConfirm={onDelete}>
              <button
                type="button"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors hover:bg-red-500/10"
                style={{ border: "1px solid #ef4444", color: "#ef4444" }}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </Popconfirm>
          </div>
        )}
      </div>
    </form>
  );
}

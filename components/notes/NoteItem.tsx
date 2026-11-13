"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import NoteForm from "./NoteForm";
import { AccountOption } from "../accounts/useAccountOptions";
import { deleteNote, updateNote } from "./noteApi";
import { NoteDTO, formatNoteDate } from "../../lib/utils/notes";

interface NoteItemProps {
  note: NoteDTO;
  onChanged: () => void;
  showAccount?: boolean;
  accounts?: AccountOption[];
}

export default function NoteItem({ note, onChanged, showAccount = true, accounts }: NoteItemProps) {
  const [editing, setEditing] = useState(false);

  const meta = [
    note.date ? formatNoteDate(note.date) : "No date",
    showAccount ? note.accountName : null,
    note.authorName,
  ].filter(Boolean);

  if (editing) {
    return (
      <div className="py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <NoteForm
          initial={{ body: note.body, date: note.date, accountId: note.accountId }}
          accounts={accounts}
          autoFocus
          onSubmit={async (values) => {
            await updateNote(note._id, values);
            setEditing(false);
            onChanged();
          }}
          onCancel={() => setEditing(false)}
          onDelete={async () => {
            await deleteNote(note._id);
            onChanged();
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-start justify-between gap-3 py-3"
      style={{ borderBottom: "1px solid var(--color-border)" }}
    >
      <div className="min-w-0">
        <p className="text-sm whitespace-pre-wrap break-words" style={{ color: "var(--color-text)" }}>
          {note.body}
        </p>
        {meta.length > 0 && (
          <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
            {meta.join(" · ")}
          </p>
        )}
      </div>
      <button
        onClick={() => setEditing(true)}
        aria-label="Edit note"
        className="shrink-0 mt-0.5"
        style={{ color: "var(--color-muted)" }}
      >
        <Pencil size={16} />
      </button>
    </div>
  );
}

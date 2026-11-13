"use client";

import { useState } from "react";
import Drawer from "../ui/Drawer";
import NoteForm from "./NoteForm";
import NoteItem from "./NoteItem";
import { createNote } from "./noteApi";
import { NoteDTO, formatNoteDate } from "../../lib/utils/notes";

interface ChartNotesDrawerProps {
  date: string | null;
  notes: NoteDTO[];
  accountId?: string;
  onClose: () => void;
  onChanged: () => void;
}

export default function ChartNotesDrawer({ date, notes, accountId, onClose, onChanged }: ChartNotesDrawerProps) {
  const [formKey, setFormKey] = useState(0);

  return (
    <Drawer open={date !== null} onClose={onClose} title={date ? formatNoteDate(date) : ""}>
      {date && (
        <div className="flex flex-col gap-4">
          {notes.length > 0 && (
            <div>
              {notes.map((note) => (
                <NoteItem key={note._id} note={note} onChanged={onChanged} />
              ))}
            </div>
          )}
          <div>
            <p className="text-xs mb-2" style={{ color: "var(--color-muted)" }}>
              Add a note
            </p>
            <NoteForm
              key={`${date}-${formKey}`}
              initial={{ date }}
              autoFocus={notes.length === 0}
              submitLabel="Add Note"
              placeholder="What happened around this date?"
              onSubmit={async (values) => {
                await createNote({ ...values, accountId: accountId ?? null });
                setFormKey((k) => k + 1);
                onChanged();
              }}
            />
          </div>
        </div>
      )}
    </Drawer>
  );
}

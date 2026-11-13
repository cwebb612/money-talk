"use client";

import { useEffect, useRef, useState } from "react";
import Card from "../ui/Card";
import NoteForm from "./NoteForm";
import NoteItem from "./NoteItem";
import { createNote, todayString } from "./noteApi";
import { NoteDTO } from "../../lib/utils/notes";

interface AccountNotesCardProps {
  accountId: string;
  notes: NoteDTO[];
  onChanged: () => void;
}

export default function AccountNotesCard({ accountId, notes, onChanged }: AccountNotesCardProps) {
  const [composerKey, setComposerKey] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);
  const feed = [...notes].reverse();

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [notes]);

  return (
    <Card>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text)" }}>
        Notes
      </h3>

      {notes.length === 0 ? (
        <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
          No notes for this account yet.
        </p>
      ) : (
        <div ref={feedRef} className="mb-4 overflow-y-auto" style={{ maxHeight: 420 }}>
          {feed.map((note) => (
            <NoteItem key={note._id} note={note} onChanged={onChanged} showAccount={false} />
          ))}
        </div>
      )}

      <NoteForm
        key={composerKey}
        initial={{ date: todayString() }}
        submitLabel="Add Note"
        placeholder="Write a note about this account…"
        onSubmit={async (values) => {
          await createNote({ ...values, accountId });
          setComposerKey((k) => k + 1);
          onChanged();
        }}
      />
    </Card>
  );
}

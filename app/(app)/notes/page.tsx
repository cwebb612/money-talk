"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Card from "../../../components/ui/Card";
import NoteForm, { NoteAccountOption } from "../../../components/notes/NoteForm";
import NoteItem from "../../../components/notes/NoteItem";
import NoteFiltersBar from "../../../components/notes/NoteFiltersBar";
import { createNote, todayString } from "../../../components/notes/noteApi";
import { DEFAULT_NOTE_FILTERS, NoteDTO, filterNotes, hasActiveNoteFilters } from "../../../lib/utils/notes";

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerKey, setComposerKey] = useState(0);
  const [filters, setFilters] = useState(DEFAULT_NOTE_FILTERS);
  const [accounts, setAccounts] = useState<NoteAccountOption[]>([]);
  const composerRef = useRef<HTMLDivElement>(null);

  const fetchNotes = useCallback(() => {
    fetch("/api/notes")
      .then((r) => r.json())
      .then((data: NoteDTO[]) => setNotes(data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchNotes();
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data: NoteAccountOption[]) =>
        setAccounts(data.map(({ _id, name }) => ({ _id, name })).sort((a, b) => a.name.localeCompare(b.name)))
      )
      .catch(() => {});
  }, [fetchNotes]);

  function goToComposer() {
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    composerRef.current?.querySelector("textarea")?.focus({ preventScroll: true });
  }

  const feed = filterNotes(notes, filters, todayString());
  const filtersActive = hasActiveNoteFilters(filters);

  function clearFilters() {
    setFilters({ ...DEFAULT_NOTE_FILTERS, sort: filters.sort });
  }

  return (
    <div className="max-w-2xl desktop:max-w-5xl mx-auto px-4 desktop:px-8 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm" style={{ color: "var(--color-muted)" }}>
          ← Dashboard
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
          Notes
        </h1>
        <button
          onClick={goToComposer}
          className="text-sm px-3 py-1 rounded-lg font-medium text-black"
          style={{ backgroundColor: "var(--color-yellow)" }}
        >
          + Add Note
        </button>
      </div>

      <div className="flex flex-col gap-6">
        <NoteFiltersBar
          filters={filters}
          accounts={accounts}
          onChange={setFilters}
        />

        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-card)" }}>
          <div
            className="flex items-center justify-between gap-4 px-4 py-3"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <p className="text-xs tabular-nums" style={{ color: "var(--color-muted)" }}>
              {loading ? "Loading…" : filtersActive ? `Showing ${feed.length} of ${notes.length} notes` : `${notes.length} ${notes.length === 1 ? "note" : "notes"}`}
            </p>
            {filtersActive && (
              <button onClick={clearFilters} className="text-xs font-medium" style={{ color: "var(--color-yellow)" }}>
                Clear filters
              </button>
            )}
          </div>

          {!loading && feed.length === 0 ? (
            <p className="text-sm px-4 py-6 text-center" style={{ color: "var(--color-muted)" }}>
              {notes.length === 0
                ? "No notes yet. Write one below, or click a point on the dashboard chart."
                : "No notes match these filters."}
            </p>
          ) : (
            <div className="px-4 -mb-px">
              {feed.map((note) => (
                <NoteItem key={note._id} note={note} onChanged={fetchNotes} accounts={accounts} />
              ))}
            </div>
          )}
        </div>

        <div ref={composerRef} style={{ scrollMarginBottom: 32 }}>
          <Card>
            {!loading && (
              <NoteForm
                key={composerKey}
                initial={{ date: todayString() }}
                accounts={accounts}
                submitLabel="Add Note"
                onSubmit={async (values) => {
                  await createNote(values);
                  setComposerKey((k) => k + 1);
                  fetchNotes();
                }}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

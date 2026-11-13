"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Card from "../../../components/ui/Card";
import ListCard, { ListCardEmpty, ListCardRows } from "../../../components/ui/ListCard";
import NoteForm from "../../../components/notes/NoteForm";
import NoteItem from "../../../components/notes/NoteItem";
import NoteFiltersBar from "../../../components/notes/NoteFiltersBar";
import { createNote } from "../../../components/notes/noteApi";
import { useAccountOptions } from "../../../components/accounts/useAccountOptions";
import { DEFAULT_NOTE_FILTERS, NoteDTO, filterNotes, hasActiveNoteFilters } from "../../../lib/utils/notes";
import { todayString } from "../../../lib/utils/filters";

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerKey, setComposerKey] = useState(0);
  const [filters, setFilters] = useState(DEFAULT_NOTE_FILTERS);
  const accounts = useAccountOptions();
  const composerRef = useRef<HTMLDivElement>(null);

  const fetchNotes = useCallback(() => {
    fetch("/api/notes")
      .then((r) => r.json())
      .then((data: NoteDTO[]) => setNotes(data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const feed = filterNotes(notes, filters, todayString());
  const filtersActive = hasActiveNoteFilters(filters);

  function feedSummary(): string {
    if (loading) return "Loading…";
    const total = `${notes.length} ${notes.length === 1 ? "note" : "notes"}`;
    return filtersActive ? `Showing ${feed.length} of ${total}` : total;
  }

  function clearFilters() {
    setFilters({ ...DEFAULT_NOTE_FILTERS, sort: filters.sort });
  }

  function goToComposer() {
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    composerRef.current?.querySelector("textarea")?.focus({ preventScroll: true });
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
        <NoteFiltersBar filters={filters} accounts={accounts} onChange={setFilters} />

        <ListCard summary={feedSummary()} onClearFilters={filtersActive ? clearFilters : undefined}>
          {!loading && feed.length === 0 ? (
            <ListCardEmpty>
              {notes.length === 0
                ? "No notes yet. Write one below, or click a point on the dashboard chart."
                : "No notes match these filters."}
            </ListCardEmpty>
          ) : (
            <ListCardRows>
              {feed.map((note) => (
                <NoteItem key={note._id} note={note} onChanged={fetchNotes} accounts={accounts} />
              ))}
            </ListCardRows>
          )}
        </ListCard>

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

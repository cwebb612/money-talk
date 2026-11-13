import { DateRange, SortOrder, rangeStartDate } from "./filters";

export const NOTE_MAX_LENGTH = 2000;

export interface NoteDTO {
  _id: string;
  body: string;
  date: string | null;
  accountId: string | null;
  accountName: string | null;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
}

export function validateNoteBody(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) return "body is required";
  if (value.trim().length > NOTE_MAX_LENGTH) return `body must be ${NOTE_MAX_LENGTH} characters or fewer`;
  return null;
}

export function sortNotes(notes: NoteDTO[]): NoteDTO[] {
  return [...notes].sort((a, b) => {
    const byDate = (b.date ?? "").localeCompare(a.date ?? "");
    if (byDate !== 0) return byDate;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function attachNotesToSeries<P extends { date: string }>(
  series: P[],
  notes: NoteDTO[]
): (P & { notes: NoteDTO[] })[] {
  const result = series.map((point) => ({ ...point, notes: [] as NoteDTO[] }));
  if (result.length === 0) return result;

  for (const note of notes) {
    if (!note.date || note.date < result[0].date) continue;
    let index = result.length - 1;
    while (index > 0 && result[index].date > note.date) index--;
    result[index].notes.push(note);
  }

  return result;
}

export function formatNoteDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const NO_ACCOUNT = "none";

export interface NoteFilters {
  query: string;
  accountId: string;
  range: DateRange;
  includeUndated: boolean;
  sort: SortOrder;
}

export const DEFAULT_NOTE_FILTERS: NoteFilters = {
  query: "",
  accountId: "",
  range: "all",
  includeUndated: true,
  sort: "oldest",
};

function matchesQuery(note: NoteDTO, query: string): boolean {
  return `${note.body} ${note.accountName ?? ""}`.toLowerCase().includes(query);
}

function matchesAccount(note: NoteDTO, accountId: string): boolean {
  if (!accountId) return true;
  if (accountId === NO_ACCOUNT) return !note.accountId;
  return note.accountId === accountId;
}

function matchesDate(note: NoteDTO, start: string | null, includeUndated: boolean): boolean {
  if (!note.date) return includeUndated;
  return !start || note.date >= start;
}

export function filterNotes(notes: NoteDTO[], filters: NoteFilters, today: string): NoteDTO[] {
  const query = filters.query.trim().toLowerCase();
  const start = rangeStartDate(filters.range, today);

  const matches = sortNotes(notes).filter(
    (note) =>
      matchesQuery(note, query) &&
      matchesAccount(note, filters.accountId) &&
      matchesDate(note, start, filters.includeUndated)
  );

  return filters.sort === "oldest" ? matches.reverse() : matches;
}

export function hasActiveNoteFilters(filters: NoteFilters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.accountId !== DEFAULT_NOTE_FILTERS.accountId ||
    filters.range !== DEFAULT_NOTE_FILTERS.range ||
    filters.includeUndated !== DEFAULT_NOTE_FILTERS.includeUndated
  );
}

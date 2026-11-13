import {
  NoteDTO,
  NoteFilters,
  DEFAULT_NOTE_FILTERS,
  NO_ACCOUNT,
  attachNotesToSeries,
  filterNotes,
  hasActiveNoteFilters,
  sortNotes,
  validateNoteBody,
} from "../../lib/utils/notes";
import { isDateString } from "../../lib/utils/filters";

function note(id: string, date: string | null, createdAt = "2026-01-01T00:00:00.000Z"): NoteDTO {
  return {
    _id: id,
    body: `note ${id}`,
    date,
    accountId: null,
    accountName: null,
    authorName: null,
    createdAt,
    updatedAt: createdAt,
  };
}

const series = [
  { date: "2026-09-01", value: 100 },
  { date: "2026-10-01", value: 200 },
  { date: "2026-11-01", value: 300 },
];

const notesOn = (points: { notes: NoteDTO[] }[]) => points.map((p) => p.notes.map((n) => n._id));

describe("attachNotesToSeries", () => {
  it("puts a note on the point with the same date", () => {
    expect(notesOn(attachNotesToSeries(series, [note("a", "2026-10-01")]))).toEqual([[], ["a"], []]);
  });

  it("puts a note between points on the earlier point", () => {
    expect(notesOn(attachNotesToSeries(series, [note("a", "2026-10-20")]))).toEqual([[], ["a"], []]);
  });

  it("puts a note after the last point on the last point", () => {
    expect(notesOn(attachNotesToSeries(series, [note("a", "2026-11-13")]))).toEqual([[], [], ["a"]]);
  });

  it("drops notes before the first point and notes without a date", () => {
    expect(notesOn(attachNotesToSeries(series, [note("a", "2026-08-01"), note("b", null)]))).toEqual([[], [], []]);
  });

  it("returns an empty series when there is no data", () => {
    expect(attachNotesToSeries([], [note("a", "2026-10-01")])).toEqual([]);
  });
});

describe("sortNotes", () => {
  it("sorts dated notes newest first, then general notes, newest first", () => {
    const sorted = sortNotes([
      note("old", "2026-01-01"),
      note("general-old", null, "2026-01-01T00:00:00.000Z"),
      note("new", "2026-10-01"),
      note("general-new", null, "2026-05-01T00:00:00.000Z"),
    ]);
    expect(sorted.map((n) => n._id)).toEqual(["new", "old", "general-new", "general-old"]);
  });
});

describe("note validation", () => {
  it("rejects an empty or whitespace body", () => {
    expect(validateNoteBody("   ")).not.toBeNull();
    expect(validateNoteBody(undefined)).not.toBeNull();
    expect(validateNoteBody("Bonus paid")).toBeNull();
  });

  it("accepts only YYYY-MM-DD dates", () => {
    expect(isDateString("2026-11-13")).toBe(true);
    expect(isDateString("11/13/2026")).toBe(false);
  });
});

describe("filterNotes", () => {
  const today = "2026-11-13";
  const withAccount = (n: NoteDTO, accountId: string, accountName: string): NoteDTO => ({ ...n, accountId, accountName });
  const notes = [
    withAccount({ ...note("recent", "2026-11-01"), body: "Paid off the car" }, "car", "Honda Loan"),
    note("spring", "2026-04-10"),
    note("last-year", "2025-06-01"),
    note("undated", null),
  ];
  const ids = (filters: Partial<NoteFilters>) =>
    filterNotes(notes, { ...DEFAULT_NOTE_FILTERS, ...filters }, today).map((n) => n._id);

  it("lists every note oldest first by default, undated first", () => {
    expect(ids({})).toEqual(["undated", "last-year", "spring", "recent"]);
  });

  it("lists newest first when sorted newest", () => {
    expect(ids({ sort: "newest" })).toEqual(["recent", "spring", "last-year", "undated"]);
  });

  it("matches the search text in the body or the account name, ignoring case", () => {
    expect(ids({ query: "CAR" })).toEqual(["recent"]);
    expect(ids({ query: "honda" })).toEqual(["recent"]);
  });

  it("filters by one account or by notes without an account", () => {
    expect(ids({ accountId: "car" })).toEqual(["recent"]);
    expect(ids({ accountId: NO_ACCOUNT })).toEqual(["undated", "last-year", "spring"]);
  });

  it("keeps dated notes inside the range and keeps undated notes unless hidden", () => {
    expect(ids({ range: "30d" })).toEqual(["undated", "recent"]);
    expect(ids({ range: "ytd", includeUndated: false })).toEqual(["spring", "recent"]);
    expect(ids({ range: "12m", includeUndated: false })).toEqual(["spring", "recent"]);
  });

  it("reports active filters but ignores the sort order", () => {
    expect(hasActiveNoteFilters(DEFAULT_NOTE_FILTERS)).toBe(false);
    expect(hasActiveNoteFilters({ ...DEFAULT_NOTE_FILTERS, sort: "newest" })).toBe(false);
    expect(hasActiveNoteFilters({ ...DEFAULT_NOTE_FILTERS, range: "30d" })).toBe(true);
  });
});

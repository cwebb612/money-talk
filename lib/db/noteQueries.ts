import { Types } from "mongoose";
import Note from "./models/note";
import Account from "./models/account";
import User from "./models/user";
import { NoteDTO, sortNotes } from "../utils/notes";

interface NoteFilter {
  id?: string;
  accountId?: string;
  datedOnly?: boolean;
}

export async function findNotes(filter: NoteFilter = {}): Promise<NoteDTO[]> {
  const query: Record<string, unknown> = {};
  if (filter.id) query._id = new Types.ObjectId(filter.id);
  if (filter.accountId) query.accountId = new Types.ObjectId(filter.accountId);
  if (filter.datedOnly) query.date = { $ne: null };

  const notes = await Note.find(query).lean();
  if (notes.length === 0) return [];

  const accountIds = [...new Set(notes.flatMap((n) => (n.accountId ? [n.accountId.toString()] : [])))];
  const authorIds = [...new Set(notes.map((n) => n.authorId.toString()))];

  const [accounts, authors] = await Promise.all([
    Account.find({ _id: { $in: accountIds } }, { name: 1 }).lean(),
    User.find({ _id: { $in: authorIds } }, { username: 1 }).lean(),
  ]);
  const accountNames = new Map(accounts.map((a) => [a._id.toString(), a.name]));
  const authorNames = new Map(authors.map((u) => [u._id.toString(), u.username]));

  return sortNotes(
    notes.map((n) => {
      const accountId = n.accountId ? n.accountId.toString() : null;
      return {
        _id: n._id.toString(),
        body: n.body,
        date: n.date ?? null,
        accountId,
        accountName: accountId ? accountNames.get(accountId) ?? null : null,
        authorName: authorNames.get(n.authorId.toString()) ?? null,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      };
    })
  );
}

export async function findNoteById(id: string): Promise<NoteDTO | null> {
  const [note] = await findNotes({ id });
  return note ?? null;
}

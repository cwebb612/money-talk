import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Types } from "mongoose";
import { verifyToken } from "../../../../lib/auth/session";
import connect from "../../../../lib/db/mongodb";
import Note from "../../../../lib/db/models/note";
import { findNoteById } from "../../../../lib/db/noteQueries";
import { isValidNoteDate, validateNoteBody } from "../../../../lib/utils/notes";

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId as string | null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));

  if (body.body !== undefined) {
    const bodyError = validateNoteBody(body.body);
    if (bodyError) return NextResponse.json({ error: bodyError }, { status: 400 });
  }
  if (body.date !== undefined && body.date !== null && !isValidNoteDate(body.date)) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }

  await connect();
  const note = await Note.findById(id);
  if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  if (body.body !== undefined) note.body = body.body.trim();
  if (body.date !== undefined) note.date = body.date;
  await note.save();

  return NextResponse.json(await findNoteById(id));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  await connect();
  const result = await Note.deleteOne({ _id: id });
  if (result.deletedCount === 0) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

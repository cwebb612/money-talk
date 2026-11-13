import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Types } from "mongoose";
import { verifyToken } from "../../../lib/auth/session";
import connect from "../../../lib/db/mongodb";
import Note from "../../../lib/db/models/note";
import { accountExists, findNotes, findNoteById } from "../../../lib/db/noteQueries";
import { validateNoteBody } from "../../../lib/utils/notes";
import { isDateString } from "../../../lib/utils/filters";

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId as string | null;
}

export async function GET(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = request.nextUrl.searchParams.get("accountId") ?? undefined;
  if (accountId && !Types.ObjectId.isValid(accountId)) {
    return NextResponse.json({ error: "Invalid accountId" }, { status: 400 });
  }

  await connect();
  return NextResponse.json(await findNotes({ accountId }));
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  const bodyError = validateNoteBody(body.body);
  if (bodyError) return NextResponse.json({ error: bodyError }, { status: 400 });

  if (body.date != null && !isDateString(body.date)) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }

  await connect();

  if (body.accountId != null && !(await accountExists(body.accountId))) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const note = await Note.create({
    body: body.body.trim(),
    date: body.date ?? null,
    accountId: body.accountId ?? null,
    authorId: new Types.ObjectId(userId),
  });

  return NextResponse.json(await findNoteById(note._id.toString()), { status: 201 });
}

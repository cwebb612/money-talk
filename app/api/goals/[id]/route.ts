import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Types } from "mongoose";
import { verifyToken } from "../../../../lib/auth/session";
import connect from "../../../../lib/db/mongodb";
import Goal from "../../../../lib/db/models/goal";
import { goalDocFields, goalStart, prepareGoalFields, toGoalDTO } from "../../../../lib/db/goalQueries";
import { GOAL_STATUSES, GoalFields, GoalStatus, goalFieldsOf, validateGoalFields } from "../../../../lib/utils/goals";
import { todayString } from "../../../../lib/utils/filters";

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId as string | null;
}

const EDITABLE_KEYS: (keyof GoalFields)[] = [
  "title",
  "notes",
  "metric",
  "accountIds",
  "targetMode",
  "targetAmount",
  "targetGrowthRate",
  "targetDate",
  "fireInputs",
  "showOnDashboard",
  "startDate",
];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  if (body.status !== undefined && !GOAL_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await connect();
  const existing = await Goal.findById(id).lean();
  if (!existing) return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  const goal = toGoalDTO(existing);

  const update: Record<string, unknown> = {};
  const edits = EDITABLE_KEYS.filter((key) => body[key] !== undefined);

  if (edits.length > 0) {
    const merged = { ...goalFieldsOf(goal), ...Object.fromEntries(edits.map((key) => [key, body[key]])) };
    const result = validateGoalFields(merged);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    const { fields } = result;

    const prepared = await prepareGoalFields(fields);
    if ("error" in prepared) return NextResponse.json({ error: prepared.error }, { status: prepared.status });

    const start = await goalStart(fields, prepared.accounts, goal);
    if ("error" in start) return NextResponse.json({ error: start.error }, { status: start.status });

    Object.assign(update, goalDocFields(fields, prepared.direction), start);
  }

  if (body.status !== undefined) {
    const status = body.status as GoalStatus;
    update.status = status;
    update.achievedAt = status === "achieved" ? goal.achievedAt ?? todayString() : null;
  }

  const updated = await Goal.findByIdAndUpdate(id, update, { returnDocument: "after", runValidators: true }).lean();
  if (!updated) return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  return NextResponse.json(toGoalDTO(updated));
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  await connect();
  const result = await Goal.deleteOne({ _id: id });
  if (result.deletedCount === 0) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

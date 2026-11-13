import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "../../../lib/auth/session";
import connect from "../../../lib/db/mongodb";
import Goal from "../../../lib/db/models/goal";
import { findGoals, goalDocFields, goalStart, nextGoalPriority, prepareGoalFields, toGoalDTO } from "../../../lib/db/goalQueries";
import { validateGoalFields } from "../../../lib/utils/goals";

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId as string | null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connect();
  return NextResponse.json(await findGoals());
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = validateGoalFields(await request.json().catch(() => null));
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  const { fields } = result;

  await connect();
  const prepared = await prepareGoalFields(fields);
  if ("error" in prepared) return NextResponse.json({ error: prepared.error }, { status: prepared.status });

  const start = await goalStart(fields, prepared.accounts);
  if ("error" in start) return NextResponse.json({ error: start.error }, { status: start.status });

  const goal = await Goal.create({
    ...goalDocFields(fields, prepared.direction),
    ...start,
    priority: await nextGoalPriority(),
  });

  return NextResponse.json(toGoalDTO(goal.toObject()), { status: 201 });
}

/**
 * @swagger
 * /api/v1/net-worth:
 *   get:
 *     summary: Net worth history
 *     description: Returns one data point per calendar day — total assets minus liabilities.
 *     tags: [Data]
 *     security:
 *       - ApiKey: []
 *     parameters:
 *       - name: from
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter results on or after this date (e.g. 2025-01-01)
 *       - name: to
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter results on or before this date
 *     responses:
 *       200:
 *         description: Array of daily net worth values
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DataPoint'
 *       401:
 *         description: Missing or invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "../../../../lib/auth/apiKey";
import connect from "../../../../lib/db/mongodb";
import Activity from "../../../../lib/db/models/activity";
import Account from "../../../../lib/db/models/account";

export async function GET(request: NextRequest) {
  const userId = await validateApiKey(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  await connect();

  const matchStage: Record<string, unknown> = {};
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    matchStage.recordedAt = dateFilter;
  }

  const accounts = await Account.find().select("_id type").lean();
  const accountTypes = new Map(accounts.map((a) => [a._id.toString(), a.type]));

  const activities = await Activity.find(matchStage).sort({ recordedAt: 1 }).lean();

  const dayMap = new Map<string, Map<string, number>>();
  for (const activity of activities) {
    const day = activity.recordedAt.toISOString().split("T")[0];
    if (!dayMap.has(day)) dayMap.set(day, new Map());
    dayMap.get(day)!.set(activity.accountId.toString(), activity.value);
  }

  const allDays = [...dayMap.keys()].sort();
  const latestValues = new Map<string, number>();
  const result: { date: string; value: number }[] = [];

  for (const day of allDays) {
    const dayEntries = dayMap.get(day)!;
    dayEntries.forEach((value, accountId) => latestValues.set(accountId, value));

    let netWorth = 0;
    latestValues.forEach((value, accountId) => {
      const type = accountTypes.get(accountId);
      netWorth += type === "liability" ? -value : value;
    });

    result.push({ date: day, value: netWorth });
  }

  return NextResponse.json(result);
}

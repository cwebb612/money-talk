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
import { buildNetWorthSeries } from "../../../../lib/utils/netWorth";

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

  const result = buildNetWorthSeries(activities, accountTypes);
  return NextResponse.json(result);
}

/**
 * @swagger
 * /api/v1/accounts/{id}/activity:
 *   get:
 *     summary: Account activity history
 *     description: Returns the reconciliation history for one account — one value per calendar day.
 *     tags: [Data]
 *     security:
 *       - ApiKey: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID from GET /api/v1/accounts
 *     responses:
 *       200:
 *         description: Array of daily account values
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
import { validateApiKey } from "../../../../../../lib/auth/apiKey";
import connect from "../../../../../../lib/db/mongodb";
import Activity from "../../../../../../lib/db/models/activity";
import { Types } from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await validateApiKey(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connect();

  const activities = await Activity.find({
    accountId: new Types.ObjectId(id),
  })
    .sort({ recordedAt: 1 })
    .lean();

  const dayMap = new Map<string, number>();
  for (const a of activities) {
    const day = a.recordedAt.toISOString().split("T")[0];
    dayMap.set(day, a.value);
  }

  const chartData = [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));

  return NextResponse.json(chartData);
}

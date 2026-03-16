/**
 * @swagger
 * /api/v1/accounts:
 *   get:
 *     summary: List accounts
 *     description: Returns all accounts with their current values.
 *     tags: [Data]
 *     security:
 *       - ApiKey: []
 *     responses:
 *       200:
 *         description: Array of accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Account'
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
import Account from "../../../../lib/db/models/account";

export async function GET(request: NextRequest) {
  const userId = await validateApiKey(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connect();
  const accounts = await Account.find().sort({ type: 1 }).lean();

  return NextResponse.json(
    accounts.map((a) => ({
      id: a._id.toString(),
      name: a.name,
      type: a.type,
      currentValue: a.currentValue,
      ...(a.balance != null ? { balance: a.balance } : {}),
      ...(a.holdings?.length ? { holdings: a.holdings } : {}),
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }))
  );
}

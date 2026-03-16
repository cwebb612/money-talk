/**
 * @swagger
 * /api/keys/{id}:
 *   delete:
 *     summary: Revoke API key
 *     description: Permanently revokes an API key. Any app using it will lose access immediately.
 *     tags: [Key Management]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Key ID from GET /api/keys
 *     responses:
 *       204:
 *         description: Key revoked
 *       404:
 *         description: Key not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../lib/auth/session";
import connect from "../../../../lib/db/mongodb";
import ApiKey from "../../../../lib/db/models/apiKey";
import { Types } from "mongoose";

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId as string | null;
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connect();

  const result = await ApiKey.deleteOne({
    _id: new Types.ObjectId(id),
    userId: new Types.ObjectId(userId),
  });

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}

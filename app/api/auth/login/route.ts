import { NextRequest, NextResponse } from "next/server";
import connect from "../../../../lib/db/mongodb";
import User from "../../../../lib/db/models/user";
import { comparePassword } from "../../../../lib/auth/password";
import { signToken, setSessionCookie } from "../../../../lib/auth/session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body?.username || !body?.password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await connect();
  const user = await User.findOne({ username: body.username });

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await comparePassword(body.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signToken({ userId: user._id.toString(), username: user.username });
  const response = NextResponse.json({ ok: true });
  setSessionCookie(response, token);
  return response;
}

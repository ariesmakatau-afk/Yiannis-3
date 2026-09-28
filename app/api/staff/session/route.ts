import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  checkPassword,
  createSessionValue,
} from "@/lib/session";

export const runtime = "nodejs";

/** Sign in. */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const password = (body as Record<string, unknown>)?.password;
  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  if (!process.env.STAFF_PASSWORD || !process.env.STAFF_SESSION_SECRET) {
    return NextResponse.json(
      { error: "Staff login isn't set up yet. STAFF_PASSWORD and STAFF_SESSION_SECRET are missing." },
      { status: 503 }
    );
  }

  if (!checkPassword(password)) {
    // Deliberately vague, and slow enough to discourage guessing.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

/** Sign out. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

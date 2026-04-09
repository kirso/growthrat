import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";

export async function GET() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json({ mode: "dormant", paused: true, isActive: false }, { status: 200 });
  }

  try {
    const convex = new ConvexHttpClient(convexUrl);
    const state = await convex.query((api.agentConfig as any).getRuntimeState, {});
    return NextResponse.json(state, { status: 200 });
  } catch {
    return NextResponse.json({ mode: "dormant", paused: true, isActive: false }, { status: 200 });
  }
}

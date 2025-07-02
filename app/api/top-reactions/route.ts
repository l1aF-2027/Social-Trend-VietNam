import { NextResponse } from "next/server";
import { getTopReactionCelebrities } from "@/lib/database";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const topic = searchParams.get("topic") || undefined;
  const sentiment = searchParams.get("sentiment") as
    | "positive"
    | "negative"
    | "all"
    | undefined;

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "Missing date range" }, { status: 400 });
  }

  try {
    const data = await getTopReactionCelebrities(
      startDate,
      endDate,
      topic,
      sentiment
    );
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

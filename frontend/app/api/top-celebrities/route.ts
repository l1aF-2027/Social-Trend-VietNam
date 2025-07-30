import { type NextRequest, NextResponse } from "next/server";
import { getTopCelebrities } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate =
      searchParams.get("startDate") || new Date().toISOString().split("T")[0];
    const endDate =
      searchParams.get("endDate") || new Date().toISOString().split("T")[0];
    const topic = searchParams.get("topic") || "all";
    const sentiment =
      (searchParams.get("sentiment") as "positive" | "negative" | "all") ||
      "all";

    const topCelebrities = await getTopCelebrities(
      startDate,
      endDate,
      topic,
      sentiment
    );

    return NextResponse.json(topCelebrities);
  } catch (error) {
    console.error("Error fetching top celebrities:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

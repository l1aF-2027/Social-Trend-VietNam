import { type NextRequest, NextResponse } from "next/server";
import { getInteractions } from "@/lib/database";

const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const subDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const startDate =
      searchParams.get("startDate") || formatDate(subDays(new Date(), 30));
    const endDate = searchParams.get("endDate") || formatDate(new Date());
    const topic = searchParams.get("topic") || "all";

    let interactions = await getInteractions(startDate, endDate, topic);

    if (limit) {
      interactions = interactions.slice(0, Number.parseInt(limit));
    }

    return NextResponse.json(interactions);
  } catch (error) {
    console.error("Error fetching interactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

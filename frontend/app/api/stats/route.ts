import { type NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate =
      searchParams.get("startDate") || new Date().toISOString().split("T")[0];
    const endDate =
      searchParams.get("endDate") || new Date().toISOString().split("T")[0];
    const topic = searchParams.get("topic") || "all";

    let result: any[];

    if (topic && topic !== "all") {
      // Filter by field with topic value
      result = await sql`
        SELECT 
          COALESCE(SUM(i.positive_count), 0) as total_positive,
          COALESCE(SUM(i.negative_count), 0) as total_negative,
          COALESCE(SUM(i.neutral_count), 0) as total_neutral,
          COUNT(DISTINCT c.id) as total_celebrities
        FROM celebrities c
        LEFT JOIN interactions i ON c.id = i.celebrity_id 
          AND i.interaction_date BETWEEN ${startDate} AND ${endDate}
          AND i.field = ${topic}
        WHERE c.is_celebrity = TRUE
          AND EXISTS (
            SELECT 1 FROM interactions i2 
            WHERE i2.celebrity_id = c.id 
              AND i2.interaction_date BETWEEN ${startDate} AND ${endDate}
              AND i2.field = ${topic}
          )
      `;
    } else {
      // All topics
      result = await sql`
        SELECT 
          COALESCE(SUM(i.positive_count), 0) as total_positive,
          COALESCE(SUM(i.negative_count), 0) as total_negative,
          COALESCE(SUM(i.neutral_count), 0) as total_neutral,
          COUNT(DISTINCT c.id) as total_celebrities
        FROM celebrities c
        LEFT JOIN interactions i ON c.id = i.celebrity_id 
          AND i.interaction_date BETWEEN ${startDate} AND ${endDate}
        WHERE c.is_celebrity = TRUE
          AND EXISTS (
            SELECT 1 FROM interactions i2 
            WHERE i2.celebrity_id = c.id 
              AND i2.interaction_date BETWEEN ${startDate} AND ${endDate}
          )
      `;
    }

    const stats = result[0] || {
      total_positive: 0,
      total_negative: 0,
      total_neutral: 0,
      total_celebrities: 0,
    };

    return NextResponse.json({
      totalPositive: Number(stats.total_positive),
      totalNegative: Number(stats.total_negative),
      totalNeutral: Number(stats.total_neutral),
      totalInteractions:
        Number(stats.total_positive) +
        Number(stats.total_negative) +
        Number(stats.total_neutral),
      totalCelebrities: Number(stats.total_celebrities),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

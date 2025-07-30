import { type NextRequest, NextResponse } from "next/server";
import { getCelebrities, addCelebrity } from "@/lib/database";

export async function GET() {
  try {
    const celebrities = await getCelebrities();
    return NextResponse.json(celebrities);
  } catch (error) {
    console.error("Error fetching celebrities:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, imageUrl } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const celebrity = await addCelebrity(name, imageUrl);
    return NextResponse.json(celebrity);
  } catch (error) {
    console.error("Error adding celebrity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

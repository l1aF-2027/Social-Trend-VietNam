import { type NextRequest, NextResponse } from "next/server";
import { getCelebrityAliases, addCelebrityAlias } from "@/lib/database";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const celebrityId = Number.parseInt(id);
    const aliases = await getCelebrityAliases(celebrityId);
    return NextResponse.json(aliases);
  } catch (error) {
    console.error("Error fetching celebrity aliases:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { alias } = await request.json();
    const celebrityId = Number.parseInt(id);

    if (!alias) {
      return NextResponse.json({ error: "Alias is required" }, { status: 400 });
    }

    const newAlias = await addCelebrityAlias(celebrityId, alias);
    return NextResponse.json(newAlias);
  } catch (error) {
    console.error("Error adding celebrity alias:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

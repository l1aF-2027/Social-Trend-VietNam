import { type NextRequest, NextResponse } from "next/server";
import { updateCelebrity } from "@/lib/database";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, imageUrl } = await request.json();
    const id = Number.parseInt(params.id);

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const celebrity = await updateCelebrity(id, name, imageUrl);
    return NextResponse.json(celebrity);
  } catch (error) {
    console.error("Error updating celebrity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

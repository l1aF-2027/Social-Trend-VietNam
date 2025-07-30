import { type NextRequest, NextResponse } from "next/server";
import { deleteCelebrityAlias } from "@/lib/database";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number.parseInt(params.id);
    await deleteCelebrityAlias(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting celebrity alias:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

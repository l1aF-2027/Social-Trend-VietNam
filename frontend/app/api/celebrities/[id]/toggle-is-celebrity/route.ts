// app/api/celebrities/[id]/toggle-is-celebrity/route.ts (Example for Next.js App Router)
import { updateCelebrityIsCelebrity } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID người nổi tiếng không hợp lệ" },
        { status: 400 }
      );
    }

    const { isCelebrity } = await request.json();

    if (typeof isCelebrity !== "boolean") {
      return NextResponse.json(
        { error: "Giá trị isCelebrity không hợp lệ" },
        { status: 400 }
      );
    }

    const updatedCelebrity = await updateCelebrityIsCelebrity(id, isCelebrity);
    return NextResponse.json(updatedCelebrity);
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái người nổi tiếng:", error);
    return NextResponse.json(
      { error: "Không thể cập nhật trạng thái người nổi tiếng" },
      { status: 500 }
    );
  }
}

// components/CelebrityTable.tsx (ensure this matches the updated lib/utils.ts and database.ts interface)
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatNumber,
  sanitizeImageUrl,
  topics,
  aspectTranslations,
} from "@/lib/utils";
import type { TopCelebrity } from "@/lib/utils"; // Import TopCelebrity from new utils file

interface CelebrityTableProps {
  currentCelebrities: TopCelebrity[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  selectedTopic: string;
  selectedSentiment: string;
  totalReactions: number;
}

export default function CelebrityTable({
  currentCelebrities,
  loading,
  currentPage,
  totalPages,
  setCurrentPage,
  selectedTopic,
  selectedSentiment, // Thêm dòng này
}: CelebrityTableProps) {
  // Get main aspects for each celebrity from the joined data
  const getMainAspects = (celebrity: TopCelebrity) => {
    if (celebrity.main_aspects && celebrity.main_aspects.length > 0) {
      const translatedAspects = celebrity.main_aspects
        .slice(0, 2) // Display up to 2 aspects
        .map((aspect) => aspectTranslations[aspect] || aspect) // Translate or use original if no translation
        .join(", ");
      return translatedAspects;
    }
    return "Chưa có thông tin"; // Default text if no aspects are available
  };

  // Fixed function to handle aliases properly
  const getDisplayAliases = (celebrity: TopCelebrity) => {
    if (!celebrity.celebrity_aliases) return "-";

    // Split by comma, trim whitespace, remove empty strings, and remove duplicates
    const aliases = celebrity.celebrity_aliases
      .split(",")
      .map((alias) => alias.trim())
      .filter(Boolean)
      .filter((alias, index, arr) => arr.indexOf(alias) === index); // Remove duplicates

    if (aliases.length === 0) return "-";
    if (aliases.length === 1) return aliases[0];

    // If more than one alias, show first one with "..."
    return <span title={aliases.join(", ")}>{aliases[0]} ...</span>;
  };

  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage;

  return (
    <Card className="bg-white border-blue-100 shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-semibold">
              Bảng Xếp Hạng Chi Tiết
            </CardTitle>
            <CardDescription>
              Danh sách người nổi tiếng có nhiều tương tác nhất (Trang{" "}
              {currentPage}/{totalPages})
              {selectedTopic !== "all" &&
                ` - Chủ đề: ${
                  topics.find((t) => t.value === selectedTopic)?.label
                }`}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {totalPages > 0 ? `${currentPage} / ${totalPages}` : "0 / 0"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={
                currentPage === totalPages || loading || totalPages === 0
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  #
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 max-w-[120px]">
                  Tên
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Biệt Danh
                </th>
                {(selectedSentiment === "all" ||
                  selectedSentiment === "positive") && (
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    <span className="text-emerald-600">Tích Cực</span>
                  </th>
                )}
                {(selectedSentiment === "all" ||
                  selectedSentiment === "negative") && (
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    <span className="text-rose-600">Tiêu Cực</span>
                  </th>
                )}
                {(selectedSentiment === "all" ||
                  selectedSentiment === "neutral") && (
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    <span className="text-purple-600">Trung Tính</span>
                  </th>
                )}
                {selectedSentiment === "all" && (
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Lượt tương tác
                  </th>
                )}

                {selectedSentiment === "all" && (
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Tổng
                  </th>
                )}
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Chủ đề
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : currentCelebrities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    Không có dữ liệu cho chủ đề này trong khoảng thời gian đã
                    chọn
                  </td>
                </tr>
              ) : (
                currentCelebrities.map((celebrity, index) => {
                  const sanitizedImageUrl = sanitizeImageUrl(
                    celebrity.image_url
                  );
                  const globalIndex = startIndex + index + 1;

                  return (
                    <tr
                      key={celebrity.celebrity_id}
                      className="border-b border-gray-100 hover:bg-blue-50"
                    >
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                          {globalIndex}
                        </span>
                      </td>
                      <td className="py-4 px-4 max-w-[120px]">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full overflow-hidden mr-3 flex-shrink-0">
                            <Image
                              src={
                                sanitizedImageUrl ||
                                "https://th.bing.com/th/id/R.901e99bb748d37365416ab41fbbb3615?rik=tPG7ldxjzp4SQA&pid=ImgRaw&r=0"
                              }
                              alt={celebrity.celebrity_name}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                              style={{
                                objectFit: "cover",
                                aspectRatio: "1/1",
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src =
                                  "https://th.bing.com/th/id/R.901e99bb748d37365416ab41fbbb3615?rik=tPG7ldxjzp4SQA&pid=ImgRaw&r=0";
                              }}
                            />
                          </div>
                          <span className="font-medium text-gray-900">
                            {celebrity.celebrity_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-blue-600">
                        {getDisplayAliases(celebrity)}
                      </td>
                      {(selectedSentiment === "all" ||
                        selectedSentiment === "positive") && (
                        <td className="py-4 px-4 text-emerald-600 font-medium text-center">
                          {formatNumber(Number(celebrity.total_positive) || 0)}
                        </td>
                      )}
                      {(selectedSentiment === "all" ||
                        selectedSentiment === "negative") && (
                        <td className="py-4 px-4 text-rose-600 font-medium text-center">
                          {formatNumber(Number(celebrity.total_negative) || 0)}
                        </td>
                      )}
                      {(selectedSentiment === "all" ||
                        selectedSentiment === "neutral") && (
                        <td className="py-4 px-4 text-purple-600 font-medium text-center">
                          {formatNumber(Number(celebrity.total_neutral) || 0)}
                        </td>
                      )}
                      {selectedSentiment === "all" && (
                        <td className="py-4 px-4 font-medium text-center text-blue-700">
                          {formatNumber(Number(celebrity.total_reactions) || 0)}
                        </td>
                      )}

                      {selectedSentiment === "all" && (
                        <td className="py-4 px-4 font-bold text-gray-900 ">
                          {formatNumber(
                            (Number(celebrity.total_positive) || 0) +
                              (Number(celebrity.total_negative) || 0) +
                              (Number(celebrity.total_neutral) || 0) +
                              (Number(celebrity.total_reactions) || 0)
                          )}
                        </td>
                      )}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getMainAspects(celebrity)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

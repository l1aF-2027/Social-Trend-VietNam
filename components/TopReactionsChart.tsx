import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { sanitizeImageUrl, topics, formatNumber } from "@/lib/utils";
import type { TopReactionCelebrity } from "@/lib/database";

interface TopReactionsChartProps {
  topReactions: TopReactionCelebrity[];
  selectedTopic: string;
  loading: boolean;
}

export default function TopReactionsChart({
  topReactions,
  selectedTopic,
  loading,
}: TopReactionsChartProps) {
  return (
    <Card className="bg-white border-blue-100 shadow-sm mb-8">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Biểu Đồ Tương Tác Top 10
        </CardTitle>
        <CardDescription>
          Hiển thị tổng số tương tác cho 10 người nổi tiếng có nhiều tương tác
          nhất
          {selectedTopic !== "all" &&
            ` - Chủ đề: ${
              topics.find((t) => t.value === selectedTopic)?.label
            }`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Đang tải dữ liệu...</div>
            </div>
          ) : topReactions.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">
                Không có dữ liệu để hiển thị cho chủ đề này
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topReactions}
                margin={{ top: 40, right: 30, left: 20, bottom: 60 }}
                maxBarSize={45}
              >
                <XAxis
                  dataKey="celebrity_name"
                  interval={0}
                  tick={({ x, y, payload }) => (
                    <foreignObject
                      x={x - 50}
                      y={y + 10}
                      width={100}
                      height={40}
                    >
                      <div
                        style={{
                          width: "80px",
                          textAlign: "center",
                          fontSize: 12,
                          color: "#374151",
                          fontWeight: 400,
                          wordBreak: "break-word",
                          whiteSpace: "normal",
                          lineHeight: "1.1",
                        }}
                      >
                        {payload.value}
                      </div>
                    </foreignObject>
                  )}
                  axisLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  tickLine={{ stroke: "#e5e7eb" }}
                />

                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  tickLine={{ stroke: "#e5e7eb" }}
                />
                <Tooltip
                  formatter={(value) => [
                    formatNumber(Number(value)),
                    "Lượng tương tác",
                  ]}
                  labelFormatter={(label) => label}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "none",
                    borderRadius: "12px",
                  }}
                />
                <Bar
                  dataKey="total_reactions"
                  fill="#60a5fa"
                  radius={[6, 6, 6, 6]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

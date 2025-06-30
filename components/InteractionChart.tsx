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
  Legend,
} from "recharts";
import { formatNumber, sanitizeImageUrl, topics } from "@/lib/utils"; // Import from new utils file
import type { TopCelebrity } from "@/lib/utils"; // Import from new utils file

const CustomLabel = (props: any) => {
  const { x, y, width, value, payload } = props;

  if (!payload || !payload.imageUrl) {
    return null;
  }

  const imageUrl = sanitizeImageUrl(payload.imageUrl);
  const altText = payload.fullName || "Celebrity";

  return (
    <g>
      <foreignObject
        x={x + width / 2 - 20}
        y={y - 50}
        width={40}
        height={40}
        style={{ overflow: "visible" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative" }}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-0.5 shadow-lg">
              <div className="w-full h-full rounded-full bg-white p-0.5">
                <img
                  src={imageUrl || "/placeholder.svg"}
                  alt={altText}
                  className="w-full h-full rounded-full object-cover"
                  style={{
                    width: "36px",
                    height: "36px",
                    objectFit: "cover",
                    aspectRatio: "1/1",
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.svg?height=36&width=36";
                  }}
                />
              </div>
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/30 to-transparent pointer-events-none"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/20 via-purple-500/20 to-pink-500/20 blur-sm -z-10"></div>
          </div>
        </div>
      </foreignObject>
    </g>
  );
};

interface InteractionChartProps {
  topCelebrities: TopCelebrity[];
  selectedSentiment: string;
  selectedTopic: string;
  loading: boolean;
}

export default function InteractionChart({
  topCelebrities,
  selectedSentiment,
  selectedTopic,
  loading,
}: InteractionChartProps) {
  const getChartData = () => {
    return topCelebrities.slice(0, 10).map((celebrity) => {
      const baseData = {
        name: celebrity.celebrity_name, // giữ nguyên tên đầy đủ
        fullName: celebrity.celebrity_name,
        imageUrl: sanitizeImageUrl(celebrity.image_url),
      };

      if (selectedSentiment === "positive") {
        return { ...baseData, "Tích cực": celebrity.total_positive };
      } else if (selectedSentiment === "negative") {
        return { ...baseData, "Tiêu cực": celebrity.total_negative };
      } else {
        return {
          ...baseData,
          "Tích cực": celebrity.total_positive,
          "Tiêu cực": celebrity.total_negative,
          "Trung tính": celebrity.total_neutral,
        };
      }
    });
  };

  const chartData = getChartData();

  return (
    <Card className="bg-white border-blue-100 shadow-sm mb-8">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Biểu Đồ Thảo Luận Top 10
        </CardTitle>
        <CardDescription>
          Hiển thị số lượng thảo luận theo từng loại cho 10 người nổi tiếng có
          nhiều tương tác nhất
          {selectedTopic !== "all" &&
            ` - Chủ đề: ${
              topics.find((t) => t.value === selectedTopic)?.label
            }`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Đang tải dữ liệu...</div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">
                Không có dữ liệu để hiển thị cho chủ đề này
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 70, right: 30, left: 20, bottom: 80 }}
                barCategoryGap="15%"
                maxBarSize={45}
              >
                <defs>
                  <linearGradient
                    id="positiveGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                    <stop offset="50%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.9} />
                  </linearGradient>
                  <linearGradient
                    id="negativeGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#fb7185" stopOpacity={0.9} />
                    <stop offset="50%" stopColor="#f43f5e" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#e11d48" stopOpacity={0.9} />
                  </linearGradient>
                  <linearGradient
                    id="neutralGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.9} />
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.9} />
                  </linearGradient>
                  <filter
                    id="shadow"
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                  >
                    <feDropShadow
                      dx="0"
                      dy="3"
                      stdDeviation="4"
                      floodColor="#00000025"
                    />
                  </filter>
                </defs>

                <XAxis
                  dataKey="name"
                  angle={0} // Để tên nằm ngang
                  textAnchor="middle"
                  height={70}
                  interval={0}
                  tick={({ x, y, payload }) => (
                    <foreignObject x={x - 50} y={y + 10} width={80} height={40}>
                      <div
                        style={{
                          width: "80px",
                          textAlign: "center",
                          fontSize: 12,
                          color: "#374151",
                          fontWeight: 500,
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
                  formatter={(value, name) => [
                    formatNumber(Number(value)),
                    name,
                  ]}
                  labelFormatter={(label) => {
                    const item = chartData.find((d) => d.name === label);
                    return item?.fullName || label;
                  }}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow:
                      "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    backdropFilter: "blur(10px)",
                  }}
                  cursor={{ fill: "rgba(59, 130, 246, 0.05)" }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "20px" }}
                  iconType="roundRect"
                  formatter={(value) => (
                    <span style={{ color: "#374151", fontWeight: 500 }}>
                      {value}
                    </span>
                  )}
                />

                {selectedSentiment === "all" && (
                  <>
                    <Bar
                      dataKey="Tích cực"
                      stackId="a"
                      fill="url(#positiveGradient)"
                      radius={[0, 0, 0, 0]}
                      filter="url(#shadow)"
                      label={<CustomLabel />}
                    />
                    <Bar
                      dataKey="Tiêu cực"
                      stackId="a"
                      fill="url(#negativeGradient)"
                      radius={[0, 0, 0, 0]}
                      filter="url(#shadow)"
                    />
                    <Bar
                      dataKey="Trung tính"
                      stackId="a"
                      fill="url(#neutralGradient)"
                      radius={[6, 6, 0, 0]}
                      filter="url(#shadow)"
                    />
                  </>
                )}
                {selectedSentiment === "positive" && (
                  <Bar
                    dataKey="Tích cực"
                    fill="url(#positiveGradient)"
                    radius={[6, 6, 6, 6]}
                    filter="url(#shadow)"
                    label={<CustomLabel />}
                  />
                )}
                {selectedSentiment === "negative" && (
                  <Bar
                    dataKey="Tiêu cực"
                    fill="url(#negativeGradient)"
                    radius={[6, 6, 6, 6]}
                    filter="url(#shadow)"
                    label={<CustomLabel />}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

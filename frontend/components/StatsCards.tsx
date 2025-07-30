import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Users, BarChart3, Activity } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { Stats } from "@/lib/utils";

interface StatsCardsProps {
  stats: Stats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white border-blue-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Tổng Tương Tác
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats.totalInteractions)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-emerald-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Tương Tác Tích Cực
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatNumber(stats.totalPositive)}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-rose-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Tương Tác Tiêu Cực
                </p>
                <p className="text-2xl font-bold text-rose-600">
                  {formatNumber(stats.totalNegative)}
                </p>
              </div>
              <div className="p-3 bg-rose-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-purple-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Người Nổi Tiếng
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatNumber(stats.totalCelebrities)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

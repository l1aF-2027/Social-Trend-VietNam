import { Settings, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  lastUpdated: Date;
}

export default function Header({ lastUpdated }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <TrendingUp className="h-6 w-6 text-blue-600 mr-3" />
            <h1 className="text-xl font-semibold text-gray-900">
              Phân Tích Tương Tác Người Nổi Tiếng
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                Cập nhật: {lastUpdated.toLocaleTimeString("vi-VN")}
              </span>
            </div>
            <Link href="/admin">
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Quản Trị
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

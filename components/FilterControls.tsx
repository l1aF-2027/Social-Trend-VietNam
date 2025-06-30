import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DateRangePicker from "@/components/DateRangePicker";
import { topics, sentimentFilters } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface FilterControlsProps {
  selectedTopic: string;
  setSelectedTopic: (topic: string) => void;
  selectedSentiment: string;
  setSelectedSentiment: (sentiment: string) => void;
  selectedDateRange: DateRange | undefined;
  setSelectedDateRange: (dateRange: DateRange | undefined) => void;
}

export default function FilterControls({
  selectedTopic,
  setSelectedTopic,
  selectedSentiment,
  setSelectedSentiment,
  selectedDateRange,
  setSelectedDateRange,
}: FilterControlsProps) {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chủ đề
          </label>
          <Select value={selectedTopic} onValueChange={setSelectedTopic}>
            <SelectTrigger className="bg-white border-blue-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {topics.map((topic) => (
                <SelectItem key={topic.value} value={topic.value}>
                  {topic.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại Tương Tác
          </label>
          <Select
            value={selectedSentiment}
            onValueChange={setSelectedSentiment}
          >
            <SelectTrigger className="bg-white border-blue-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sentimentFilters.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="border-blue-200">
          <label className="block text-sm font-medium text-gray-700 mb-2 ">
            Khoảng Thời Gian
          </label>
          <DateRangePicker
            value={selectedDateRange}
            onChange={setSelectedDateRange}
          />
        </div>
      </div>
    </div>
  );
}

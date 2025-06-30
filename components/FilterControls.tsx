import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { topics, sentimentFilters, timeRanges } from "@/lib/utils"; // Import from new utils file

interface FilterControlsProps {
  selectedTopic: string;
  setSelectedTopic: (topic: string) => void;
  selectedSentiment: string;
  setSelectedSentiment: (sentiment: string) => void;
  selectedTimeRange: string;
  setSelectedTimeRange: (timeRange: string) => void;
}

export default function FilterControls({
  selectedTopic,
  setSelectedTopic,
  selectedSentiment,
  setSelectedSentiment,
  selectedTimeRange,
  setSelectedTimeRange,
}: FilterControlsProps) {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thời Gian
          </label>
          <Select
            value={selectedTimeRange}
            onValueChange={setSelectedTimeRange}
          >
            <SelectTrigger className="bg-white border-blue-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

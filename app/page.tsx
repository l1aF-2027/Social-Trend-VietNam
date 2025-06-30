"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import FilterControls from "@/components/FilterControls";
import InteractionChart from "@/components/InteractionChart";
import CelebrityTable from "@/components/CelebrityTable";
import StatsCards from "@/components/StatsCards";
import TopReactionsChart from "@/components/TopReactionsChart";
import { formatDate, startOfMonth, endOfMonth } from "@/lib/utils"; // Import utilities from new utils file
import type { TopCelebrity, Stats } from "@/lib/utils"; // Import types from new utils file
import type { TopReactionCelebrity } from "@/lib/database";

export default function Dashboard() {
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedSentiment, setSelectedSentiment] = useState("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState("this_month");
  const [topCelebrities, setTopCelebrities] = useState<TopCelebrity[]>([]);
  const [topReactions, setTopReactions] = useState<TopReactionCelebrity[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalInteractions: 0,
    totalPositive: 0,
    totalNegative: 0,
    totalNeutral: 0,
    totalCelebrities: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [dataHash, setDataHash] = useState<string>("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const itemsPerPage = 10;

  // Create hash of data to detect changes
  const createDataHash = useCallback(
    (celebrities: TopCelebrity[], stats: Stats): string => {
      const dataString = JSON.stringify({ celebrities, stats });
      // Simple hash function
      let hash = 0;
      for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return hash.toString();
    },
    []
  );

  // Calculate date range based on selection
  const getDateRange = (timeRange: string) => {
    const now = new Date();
    switch (timeRange) {
      case "this_month":
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case "last_month":
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      case "this_week":
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(
          now.setDate(now.getDate() - now.getDay() + 6)
        );
        return { from: startOfWeek, to: endOfWeek };
      case "last_week":
        const lastWeekStart = new Date(
          now.setDate(now.getDate() - now.getDay() - 7)
        );
        const lastWeekEnd = new Date(
          now.setDate(now.getDate() - now.getDay() - 1)
        );
        return { from: lastWeekStart, to: lastWeekEnd };
      default:
        return { from: startOfMonth(now), to: endOfMonth(now) };
    }
  };

  const fetchData = useCallback(
    async (showChangeNotification = false) => {
      if (!showChangeNotification) {
        setLoading(true);
      }

      try {
        const dateRange = getDateRange(selectedTimeRange);
        const params = new URLSearchParams({
          startDate: formatDate(dateRange.from),
          endDate: formatDate(dateRange.to),
          topic: selectedTopic,
          sentiment: selectedSentiment,
        });

        // Fetch top celebrities for chart and table
        const celebritiesResponse = await fetch(
          `/api/top-celebrities?${params}`
        );
        const celebritiesData = await celebritiesResponse.json();
        const newCelebrities = Array.isArray(celebritiesData)
          ? celebritiesData
          : [];

        // Fetch top reactions for new chart
        const reactionsResponse = await fetch(
          `/api/top-reactions?startDate=${formatDate(
            dateRange.from
          )}&endDate=${formatDate(dateRange.to)}`
        );
        const reactionsData = await reactionsResponse.json();
        const newReactions = Array.isArray(reactionsData) ? reactionsData : [];

        // Fetch overall stats from filtered data
        const statsResponse = await fetch(`/api/stats?${params}`);
        const newStats = await statsResponse.json();

        // Create hash of new data
        const newHash = createDataHash(newCelebrities, newStats);

        // Check if data has changed
        if (showChangeNotification && dataHash && newHash !== dataHash) {
          // Data has changed, show notification
          console.log("🔄 Data updated automatically!");
          // You can add a toast notification here if needed
        }

        setTopCelebrities(newCelebrities);
        setTopReactions(newReactions);
        setStats(newStats);
        setDataHash(newHash);
        setLastUpdated(new Date());

        console.log("Fetched celebrities data:", newCelebrities); // Debug log
        console.log("Fetched reactions data:", newReactions); // Debug log
        console.log("Fetched stats data:", newStats); // Debug log
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        setTopCelebrities([]);
        setTopReactions([]);
        setStats({
          totalInteractions: 0,
          totalPositive: 0,
          totalNegative: 0,
          totalNeutral: 0,
          totalCelebrities: 0,
        });
      } finally {
        if (!showChangeNotification) {
          setLoading(false);
        }
      }
    },
    [
      selectedTopic,
      selectedSentiment,
      selectedTimeRange,
      dataHash,
      createDataHash,
    ]
  );

  useEffect(() => {
    fetchData();
    setCurrentPage(1); // Reset to first page when filters change
  }, [selectedTopic, selectedSentiment, selectedTimeRange, fetchData]);

  // Auto-refresh effect
  useEffect(() => {
    if (isAutoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchData(true); // true = show change notification
      }, 5000); // 5 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoRefresh, fetchData]);

  // Pagination logic
  const totalPages = Math.ceil(topCelebrities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCelebrities = topCelebrities.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header lastUpdated={lastUpdated} />

      <div className="max-w-7xl mx-auto px-6 py-6">
        <StatsCards stats={stats} />
        <FilterControls
          selectedTopic={selectedTopic}
          setSelectedTopic={setSelectedTopic}
          selectedSentiment={selectedSentiment}
          setSelectedSentiment={setSelectedSentiment}
          selectedTimeRange={selectedTimeRange}
          setSelectedTimeRange={setSelectedTimeRange}
        />

        <InteractionChart
          topCelebrities={topCelebrities}
          selectedSentiment={selectedSentiment}
          selectedTopic={selectedTopic}
          loading={loading}
        />

        <TopReactionsChart
          topReactions={topReactions}
          selectedTopic={selectedTopic}
          loading={loading}
        />

        <CelebrityTable
          currentCelebrities={currentCelebrities}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          selectedTopic={selectedTopic}
          selectedSentiment={selectedSentiment}
        />
      </div>
    </div>
  );
}

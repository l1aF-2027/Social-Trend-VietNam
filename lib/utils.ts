import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// lib/utils.ts (ensure this matches the updated database.ts interface)
// Utility functions
export const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("vi-VN").format(num);
};

export const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const endOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

// URL validation and sanitization
export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== "string") return false;
  try {
    new URL(url);
    return true;
  } catch {
    return url.startsWith("/") && url.length > 1;
  }
};

export const sanitizeImageUrl = (url: string | null | undefined): string => {
  const defaultImage = "/placeholder.svg?height=40&width=40";
  if (!url) return defaultImage;
  const cleanUrl = url.trim();
  if (!isValidUrl(cleanUrl)) {
    return defaultImage;
  }
  return cleanUrl;
};

// Data types
export interface TopCelebrity {
  celebrity_id: number;
  celebrity_name: string;
  celebrity_aliases: string | null;
  image_url: string | null;
  is_celebrity: boolean; // Add this field
  total_positive: number;
  total_negative: number;
  total_neutral: number;
  total_interactions: number;
  main_aspects: string[];
}

export interface Stats {
  totalInteractions: number;
  totalPositive: number;
  totalNegative: number;
  totalNeutral: number;
  totalCelebrities: number;
}

// Filter options
export const topics = [
  { value: "all", label: "Tất cả chủ đề" },
  { value: "Art", label: "Nghệ thuật" },
  { value: "Fashion", label: "Thời trang" },
  { value: "Food", label: "Ẩm thực" },
  { value: "Health", label: "Sức khỏe" },
  { value: "Law", label: "Pháp luật" },
  { value: "Other", label: "Khác" },
  { value: "Sport", label: "Thể thao" },
];

export const sentimentFilters = [
  { value: "all", label: "Tất cả" },
  { value: "positive", label: "Tích cực" },
  { value: "negative", label: "Tiêu cực" },
];

export const timeRanges = [
  { value: "this_month", label: "Tháng này" },
  { value: "last_month", label: "Tháng trước" },
  { value: "this_week", label: "Tuần này" },
  { value: "last_week", label: "Tuần trước" },
];

// Aspect translations mapping
export const aspectTranslations: { [key: string]: string } = {
  Art: "Nghệ thuật",
  Fashion: "Thời trang",
  Food: "Ẩm thực",
  Health: "Sức khỏe",
  Law: "Pháp luật",
  Sport: "Thể thao",
  Other: "Khác",
};
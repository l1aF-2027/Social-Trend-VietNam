import React, { useState, useRef, useEffect } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import { vi } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";

interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}

const DEFAULT_RANGE: DateRange = {
  from: new Date(2025, 6, 1), // Tháng 5 là 4 (0-based)
  to: new Date(2025, 6, 6),
};

function formatRange(range: DateRange | undefined) {
  if (!range?.from || !range?.to) return "";
  return `${format(range.from, "dd/MM/yyyy")} - ${format(range.to, "dd/MM/yyyy")}`;
}

export default function DateRangePicker({
  value,
  onChange,
  className = "",
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Đặt mặc định nếu chưa có value
  useEffect(() => {
    if (!value) onChange(DEFAULT_RANGE);
    // eslint-disable-next-line
  }, []);

  // Đóng popup khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div
      className={`relative border-blue-200 inline-block w-full ${className} `}
      ref={ref}
    >
      <input
        readOnly
        value={formatRange(value)}
        onClick={() => setOpen((v) => !v)}
        className="w-full cursor-pointer px-3 py-2 rounded border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
      />
      {open && (
        <div className="absolute left-0 mt-2 z-20 bg-white rounded shadow-lg border border-gray-200">
          <DayPicker
            mode="range"
            selected={value}
            onSelect={onChange}
            locale={vi}
            showOutsideDays
            className="p-2"
          />
        </div>
      )}
    </div>
  );
}
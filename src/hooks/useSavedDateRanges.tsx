import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";

export interface SavedDateRange {
  id: string;
  name: string;
  from: string;
  to: string;
}

const STORAGE_KEY = "saved-date-ranges";

export function useSavedDateRanges() {
  const [savedRanges, setSavedRanges] = useState<SavedDateRange[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedRanges(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved date ranges:", e);
      }
    }
  }, []);

  const saveRange = (name: string, range: DateRange) => {
    if (!range.from || !range.to) return;
    
    const newRange: SavedDateRange = {
      id: crypto.randomUUID(),
      name,
      from: range.from.toISOString(),
      to: range.to.toISOString(),
    };

    const updated = [...savedRanges, newRange];
    setSavedRanges(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteRange = (id: string) => {
    const updated = savedRanges.filter((r) => r.id !== id);
    setSavedRanges(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const getDateRange = (saved: SavedDateRange): DateRange => ({
    from: new Date(saved.from),
    to: new Date(saved.to),
  });

  return {
    savedRanges,
    saveRange,
    deleteRange,
    getDateRange,
  };
}

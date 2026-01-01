import { useState, useEffect } from "react";

export type OptimizationStats = {
  totalImages: number;
  totalSavedBytes: number;
};

export type InsertOptimization = {
  originalSize: number;
  optimizedSize: number;
  format: string;
  quality: number;
};

const STATS_KEY = "zemenpix_stats";

function getStats(): OptimizationStats {
  const stored = localStorage.getItem(STATS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse stats", e);
    }
  }
  return { totalImages: 0, totalSavedBytes: 0 };
}

function saveStats(stats: OptimizationStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function useGlobalStats() {
  const [stats, setStats] = useState<OptimizationStats>(getStats());

  useEffect(() => {
    const handleStorageChange = () => {
      setStats(getStats());
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return { data: stats, isLoading: false };
}

export function useTrackOptimization() {
  return {
    mutate: (data: InsertOptimization) => {
      const current = getStats();
      const savedBytes = data.originalSize - data.optimizedSize;
      const next = {
        totalImages: current.totalImages + 1,
        totalSavedBytes: current.totalSavedBytes + (savedBytes > 0 ? savedBytes : 0),
      };
      saveStats(next);
      window.dispatchEvent(new Event("storage"));
    }
  };
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient";
import { useUserStore } from "../stores/userSlice";

export interface DashboardAppointment {
  id: string;
  title: string;
  clientName: string;
  date: string;
  time: string;
  status: string;
}

export interface DashboardSalesPoint {
  month: string;
  year: number;
  revenue: number;
}

export interface DashboardStats {
  totalRevenue: number;
  revenueGrowth: number;
  activeClients: number;
  newClientsThisMonth: number;
  pendingOrders: number;
  ordersThisWeek: number;
  inventoryValue: number;
  totalInventoryItems: number;
  completionRate: number;
  clientSatisfaction: number;
  averageOrderValue: number;
  todaysAppointments: DashboardAppointment[];
  salesChart: DashboardSalesPoint[];
  lastUpdated: string;
}

interface UseDashboardReturn {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// Cache key — per user so data never leaks between accounts
const cacheKey = (uid: string) => `dashboard_stats_${uid}`;

async function readCache(uid: string): Promise<DashboardStats | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(uid));
    if (!raw) return null;
    return JSON.parse(raw) as DashboardStats;
  } catch {
    return null;
  }
}

async function writeCache(uid: string, data: DashboardStats): Promise<void> {
  try {
    await AsyncStorage.setItem(cacheKey(uid), JSON.stringify(data));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

export function useDashboard(): UseDashboardReturn {
  const user = useUserStore((state) => state.user);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAndUpdate = useCallback(
    async (silent: boolean) => {
      if (!user) return;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<{ success: boolean; data: DashboardStats }>(
          "/dashboard/stats",
        );
        setStats(res.data);
        await writeCache(user.uid, res.data);
      } catch (err: any) {
        console.error("[useDashboard] Failed to fetch stats:", err);
        // Only surface the error if we have nothing to show
        setError((prev) => {
          if (stats === null) return err.message ?? "Failed to load dashboard";
          return prev;
        });
      } finally {
        if (!silent) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user],
  );

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const init = async () => {
      // 1. Load cached data immediately (show something fast)
      const cached = await readCache(user.uid);

      if (cancelled) return;

      if (cached) {
        // Show cached data right away, then revalidate silently in background
        setStats(cached);
        fetchAndUpdate(true /* silent */);
      } else {
        // Nothing cached — show spinner and wait for network
        fetchAndUpdate(false /* show loading */);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [user, fetchAndUpdate]);

  const refresh = useCallback(() => {
    fetchAndUpdate(false);
  }, [fetchAndUpdate]);

  return { stats, loading, error, refresh };
}

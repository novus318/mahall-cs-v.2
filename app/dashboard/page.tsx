'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { OverviewChart } from '@/components/dashboard/OverviewChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { Users, Home, IndianRupee, AlertCircle, LayoutDashboard, Wallet } from "lucide-react";
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const statsRes = await api.get('/dashboard/stats');
      const recentRes = await api.get('/dashboard/recent');

      setStats(statsRes.data);
      setRecentActivity(recentRes.data.transactions || []);

    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="col-span-4 h-[350px] rounded-xl" />
          <Skeleton className="col-span-3 h-[350px] rounded-xl" />
        </div>
      </div>
    );
  }

  // No need to format chart data, backend now sends it pre-formatted
  const chartData = stats?.financials?.trends || [];

  return (
    <div className="flex-1 space-y-6 md:p-8 p-4 pt-6 w-full dark:bg-black/5 min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Balance"
          value={`₹${stats?.financials?.balance?.toLocaleString() || 0}`}
          icon={Wallet}
          description="Across all accounts"
          className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10"
        />
        <StatsCard
          title="Total Members"
          value={stats?.counts?.members || 0}
          icon={Users}
          description="Registered members"
        />
        <StatsCard
          title="Total Houses"
          value={stats?.counts?.houses || 0}
          icon={Home}
          description="Total properties managed"
        />
        <StatsCard
          title="Active Tenants"
          value={stats?.counts?.tenants || 0}
          icon={Home}
          description="Currently renting"
        />
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-1 md:col-span-2 lg:col-span-4">
          <OverviewChart data={chartData} />
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <RecentTransactions transactions={recentActivity} />
        </div>
      </div>

      {/* Quick Actions (Optional) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Can add quick link buttons here later */}
      </div>
    </div>
  );
}

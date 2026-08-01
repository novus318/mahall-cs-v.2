'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { OverviewChart } from '@/components/dashboard/OverviewChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { FinancialOverviewCard } from '@/components/dashboard/FinancialOverviewCard';
import { FinancialBreakdownChart } from '@/components/dashboard/FinancialBreakdownChart';
import { Users, Home, Wallet, Building2, UserCircle, FileText, CircleDollarSign, HandCoins, RefreshCw } from "lucide-react";
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    setStatsLoading(true);
    setRecentLoading(true);

    api.get('/dashboard/stats')
      .then((statsRes) => {
        setStats(statsRes.data);
        setStatsLoading(false);
      })
      .catch((error) => {
        console.error('Stats error:', error);
        toast.error("Failed to load dashboard stats");
        setStatsLoading(false);
      });

    api.get('/dashboard/recent')
      .then((recentRes) => {
        setRecentActivity(recentRes.data.transactions || []);
        setRecentLoading(false);
      })
      .catch((error) => {
        console.error('Recent activity error:', error);
        toast.error("Failed to load recent activity");
        setRecentLoading(false);
      })
      .finally(() => setIsRefreshing(false));
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.username) setUsername(parsed.username);
      } catch (error) {
        console.error('Failed to parse user', error);
      }
    }
    fetchDashboardData();
  }, []);

  const chartData = stats?.financials?.trends || [];
  const receivables = stats?.financials?.receivables || {};
  const payables = stats?.financials?.payables || {};

  const receivablesItems = [
    {
      label: "House Dues",
      pending: receivables.houseDues?.pending || 0,
      completed: receivables.houseDues?.collected || 0,
      count: receivables.houseDues?.count || 0,
      href: "/dashboard/collections?entityType=House&status=PENDING",
      icon: <Home className="h-4 w-4 text-chart-1" />
    },
    {
      label: "Member Dues",
      pending: receivables.memberDues?.pending || 0,
      completed: receivables.memberDues?.collected || 0,
      count: receivables.memberDues?.count || 0,
      href: "/dashboard/collections?entityType=Member&status=PENDING",
      icon: <UserCircle className="h-4 w-4 text-chart-3" />
    },
    {
      label: "Rent Dues",
      pending: receivables.rentDues?.pending || 0,
      completed: receivables.rentDues?.collected || 0,
      count: receivables.rentDues?.count || 0,
      href: "/dashboard/contracts",
      icon: <Building2 className="h-4 w-4 text-chart-2" />
    }
  ];

  const payablesItems = [
    {
      label: "Staff Salaries",
      pending: payables.salaries?.pending || 0,
      completed: payables.salaries?.paid || 0,
      count: payables.salaries?.count || 0,
      href: "/dashboard/staff",
      icon: <UserCircle className="h-4 w-4 text-chart-2" />
    },
    {
      label: "Pending Payments",
      pending: payables.payments?.pending || 0,
      completed: payables.payments?.completed || 0,
      count: payables.payments?.count || 0,
      href: "/dashboard/payments?status=PENDING",
      icon: <FileText className="h-4 w-4 text-destructive" />
    },
    {
      label: "Security Deposits",
      pending: payables.deposits?.held || 0,
      completed: payables.deposits?.returned || 0,
      count: payables.deposits?.count || 0,
      href: "/dashboard/contracts",
      icon: <CircleDollarSign className="h-4 w-4 text-chart-4" />
    },
    {
      label: "Loans & Credit",
      pending: payables.loans?.pending || 0,
      completed: payables.loans?.repaid || 0,
      count: payables.loans?.count || 0,
      href: "/dashboard/payables",
      icon: <HandCoins className="h-4 w-4 text-chart-3" />
    }
  ];

  const receivablesBreakdown = [
    { name: "House Dues", value: receivables.houseDues?.pending || 0, color: "var(--color-chart-1)" },
    { name: "Member Dues", value: receivables.memberDues?.pending || 0, color: "var(--color-chart-3)" },
    { name: "Rent Dues", value: receivables.rentDues?.pending || 0, color: "var(--color-chart-2)" }
  ].filter(item => item.value > 0);

  const payablesBreakdown = [
    { name: "Salaries", value: payables.salaries?.pending || 0, color: "var(--color-chart-2)" },
    { name: "Payments", value: payables.payments?.pending || 0, color: "var(--color-destructive)" },
    { name: "Deposits", value: payables.deposits?.held || 0, color: "var(--color-chart-4)" },
    { name: "Loans", value: payables.loans?.pending || 0, color: "var(--color-chart-3)" }
  ].filter(item => item.value > 0);

  return (
    <div className="flex-1 w-full space-y-8 p-4 pt-8 md:p-8 bg-muted/40 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
            Overview
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {username ? `Welcome back, ${username}` : "Dashboard"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Here&apos;s a snapshot of the Mahall at a glance.
          </p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" size="sm" disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsLoading ? (
          [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[130px] rounded-xl" />)
        ) : (
          <>
            <StatsCard
              title="Total Balance"
              value={`₹${stats?.financials?.balance?.toLocaleString() || 0}`}
              icon={Wallet}
              tone="primary"
              description="Across all accounts"
              href="/dashboard/accounts"
            />
            <StatsCard
              title="Total Members"
              value={stats?.counts?.members || 0}
              icon={Users}
              tone="chart-2"
              description="Registered members"
              href="/dashboard/members"
            />
            <StatsCard
              title="Total Houses"
              value={stats?.counts?.houses || 0}
              icon={Home}
              tone="chart-4"
              description="Total properties managed"
              href="/dashboard/houses"
            />
            <StatsCard
              title="Active Tenants"
              value={stats?.counts?.tenants || 0}
              icon={Building2}
              tone="chart-3"
              description="Currently renting"
              href="/dashboard/contracts"
            />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {statsLoading ? (
          <>
            <Skeleton className="h-[400px] rounded-xl" />
            <Skeleton className="h-[400px] rounded-xl" />
          </>
        ) : (
          <>
            <FinancialOverviewCard
              title="Receivables"
              type="receivables"
              totalPending={receivables.total?.pending || 0}
              totalCompleted={receivables.total?.collected || 0}
              items={receivablesItems}
            />
            <FinancialOverviewCard
              title="Payables"
              type="payables"
              totalPending={payables.total?.pending || 0}
              totalCompleted={payables.total?.paid || 0}
              items={payablesItems}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-7">
        <div className="xl:col-span-4">
          {statsLoading ? (
            <Skeleton className="h-[350px] rounded-xl" />
          ) : (
            <OverviewChart data={chartData} />
          )}
        </div>
        <div className="xl:col-span-3">
          {recentLoading ? (
            <Skeleton className="h-[350px] rounded-xl" />
          ) : (
            <RecentTransactions transactions={recentActivity} />
          )}
        </div>
      </div>
    </div>
  );
}

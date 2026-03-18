'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { OverviewChart } from '@/components/dashboard/OverviewChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { FinancialOverviewCard } from '@/components/dashboard/FinancialOverviewCard';
import { FinancialBreakdownChart } from '@/components/dashboard/FinancialBreakdownChart';
import { Users, Home, Wallet, LayoutDashboard, Building2, UserCircle, Banknote, FileText, CircleDollarSign, HandCoins } from "lucide-react";
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

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
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="col-span-4 h-[350px] rounded-xl" />
          <Skeleton className="col-span-3 h-[350px] rounded-xl" />
        </div>
      </div>
    );
  }

  const chartData = stats?.financials?.trends || [];
  const receivables = stats?.financials?.receivables || {};
  const payables = stats?.financials?.payables || {};

  // Prepare receivables items with deep links
  const receivablesItems = [
    {
      label: "House Dues",
      pending: receivables.houseDues?.pending || 0,
      completed: receivables.houseDues?.collected || 0,
      count: receivables.houseDues?.count || 0,
      href: "/dashboard/collections?entityType=House&status=PENDING",
      icon: <Home className="h-4 w-4" />
    },
    {
      label: "Member Dues",
      pending: receivables.memberDues?.pending || 0,
      completed: receivables.memberDues?.collected || 0,
      count: receivables.memberDues?.count || 0,
      href: "/dashboard/collections?entityType=Member&status=PENDING",
      icon: <UserCircle className="h-4 w-4" />
    },
    {
      label: "Rent Dues",
      pending: receivables.rentDues?.pending || 0,
      completed: receivables.rentDues?.collected || 0,
      count: receivables.rentDues?.count || 0,
      href: "/dashboard/contracts",
      icon: <Building2 className="h-4 w-4" />
    }
  ];

  // Prepare payables items with deep links
  const payablesItems = [
    {
      label: "Staff Salaries",
      pending: payables.salaries?.pending || 0,
      completed: payables.salaries?.paid || 0,
      count: payables.salaries?.count || 0,
      href: "/dashboard/staff",
      icon: <UserCircle className="h-4 w-4" />
    },
    {
      label: "Pending Payments",
      pending: payables.payments?.pending || 0,
      completed: payables.payments?.completed || 0,
      count: payables.payments?.count || 0,
      href: "/dashboard/payments?status=PENDING",
      icon: <FileText className="h-4 w-4" />
    },
    {
      label: "Security Deposits",
      pending: payables.deposits?.held || 0,
      completed: payables.deposits?.returned || 0,
      count: payables.deposits?.count || 0,
      href: "/dashboard/contracts",
      icon: <CircleDollarSign className="h-4 w-4" />
    },
    {
      label: "Loans & Credit",
      pending: payables.loans?.pending || 0,
      completed: payables.loans?.repaid || 0,
      count: payables.loans?.count || 0,
      href: "/dashboard/payables",
      icon: <HandCoins className="h-4 w-4" />
    }
  ];

  // Prepare breakdown data for pie charts
  const receivablesBreakdown = [
    { name: "House Dues", value: receivables.houseDues?.pending || 0, color: "#10b981" },
    { name: "Member Dues", value: receivables.memberDues?.pending || 0, color: "#3b82f6" },
    { name: "Rent Dues", value: receivables.rentDues?.pending || 0, color: "#8b5cf6" }
  ].filter(item => item.value > 0);

  const payablesBreakdown = [
    { name: "Salaries", value: payables.salaries?.pending || 0, color: "#f59e0b" },
    { name: "Payments", value: payables.payments?.pending || 0, color: "#ef4444" },
    { name: "Deposits", value: payables.deposits?.held || 0, color: "#ec4899" },
    { name: "Loans", value: payables.loans?.pending || 0, color: "#8b5cf6" }
  ].filter(item => item.value > 0);

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
          href="/dashboard/accounts"
        />
        <StatsCard
          title="Total Members"
          value={stats?.counts?.members || 0}
          icon={Users}
          description="Registered members"
          href="/dashboard/members"
        />
        <StatsCard
          title="Total Houses"
          value={stats?.counts?.houses || 0}
          icon={Home}
          description="Total properties managed"
          href="/dashboard/houses"
        />
        <StatsCard
          title="Active Tenants"
          value={stats?.counts?.tenants || 0}
          icon={Building2}
          description="Currently renting"
          href="/dashboard/contracts"
        />
      </div>

      {/* Financial Overview - Receivables & Payables */}
      <div className="grid gap-4 md:grid-cols-2">
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
      </div>

      {/* Income vs Expenses Trend & Recent Activity */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-1 md:col-span-2 lg:col-span-4">
          <OverviewChart data={chartData} />
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <RecentTransactions transactions={recentActivity} />
        </div>
      </div>
    </div>
  );
}

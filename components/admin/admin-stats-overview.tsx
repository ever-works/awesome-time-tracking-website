import { Users, FileText, Eye, MessageSquare } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { AdminStats } from "@/hooks/use-admin-stats";

interface AdminStatsOverviewProps {
  stats: AdminStats | undefined;
  isLoading: boolean;
}

export function AdminStatsOverview({ stats, isLoading }: AdminStatsOverviewProps) {
  const growthPercentage = stats ? 
    stats.totalUsers > 0 
      ? Math.round((stats.newUsersToday / stats.totalUsers) * 100 * 100) / 100
      : 0
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Total Users"
        value={stats?.totalUsers || 0}
        description={`${stats?.registeredUsers || 0} registered users`}
        icon={Users}
        trend={{ value: growthPercentage, isPositive: growthPercentage >= 0 }}
        isLoading={isLoading}
      />
      
      <StatsCard
        title="Submissions"
        value={stats?.totalSubmissions || 0}
        description={`${stats?.pendingSubmissions || 0} pending review`}
        icon={FileText}
        isLoading={isLoading}
      />
      
      <StatsCard
        title="Total Views"
        value={stats?.totalViews || 0}
        description="Platform-wide views"
        icon={Eye}
        isLoading={isLoading}
      />
      
      <StatsCard
        title="Engagement"
        value={stats?.totalVotes || 0}
        description={`${stats?.totalComments || 0} comments`}
        icon={MessageSquare}
        isLoading={isLoading}
      />
    </div>
  );
} 
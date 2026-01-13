import { BranchCard } from "@/components/dashboard/BranchCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { InventoryAlerts } from "@/components/dashboard/InventoryAlerts";
import { Users, Calendar, DollarSign, Activity, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const branches = [
  { name: "Machakos Branch", location: "Machakos Town", revenue: 245000, patients: 156, trend: 12, status: "online" as const },
  { name: "Mlolongo Branch", location: "Mlolongo Center", revenue: 189000, patients: 98, trend: 8, status: "online" as const },
  { name: "Matuu Branch", location: "Matuu Town", revenue: 134000, patients: 72, trend: -3, status: "syncing" as const },
  { name: "Tala Town Branch", location: "Tala Town", revenue: 167000, patients: 84, trend: 15, status: "online" as const },
];

export default function Dashboard() {
  const totalRevenue = branches.reduce((sum, b) => sum + b.revenue, 0);
  const totalPatients = branches.reduce((sum, b) => sum + b.patients, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of all Nature Vital Wellness Center branches</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Revenue (Week)"
          value={`KES ${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: 8.5, label: "vs last week" }}
          variant="primary"
        />
        <StatsCard
          title="Total Patients"
          value={totalPatients}
          subtitle="Across all branches"
          icon={Users}
          trend={{ value: 12, label: "new this week" }}
        />
        <StatsCard
          title="Appointments Today"
          value={47}
          subtitle="12 pending"
          icon={Calendar}
        />
        <StatsCard
          title="System Health"
          value="98.5%"
          subtitle="All systems operational"
          icon={Activity}
          variant="accent"
        />
      </div>

      {/* Branch Cards */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Branch Performance</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {branches.map((branch) => (
            <BranchCard key={branch.name} {...branch} />
          ))}
        </div>
      </div>

      {/* Activity and Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <InventoryAlerts />
      </div>
    </div>
  );
}

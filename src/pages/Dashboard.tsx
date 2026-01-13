import { BranchCard } from "@/components/dashboard/BranchCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { InventoryAlerts } from "@/components/dashboard/InventoryAlerts";
import { InventoryForecastWidget } from "@/components/dashboard/InventoryForecastWidget";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Calendar, DollarSign, Activity, MapPin, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const branches = [
  { name: "Machakos Branch", location: "Machakos Town", revenue: 245000, patients: 156, trend: 12, status: "online" as const },
  { name: "Mlolongo Branch", location: "Mlolongo Center", revenue: 189000, patients: 98, trend: 8, status: "online" as const },
  { name: "Matuu Branch", location: "Matuu Town", revenue: 134000, patients: 72, trend: -3, status: "syncing" as const },
  { name: "Tala Town Branch", location: "Tala Town", revenue: 167000, patients: 84, trend: 15, status: "online" as const },
];

export default function Dashboard() {
  const { profile, roles, isSuperAdmin } = useAuth();
  
  const totalRevenue = branches.reduce((sum, b) => sum + b.revenue, 0);
  const totalPatients = branches.reduce((sum, b) => sum + b.patients, 0);

  const getRoleDisplay = () => {
    if (isSuperAdmin) return "Super Admin";
    if (roles.includes("branch_admin")) return "Branch Admin";
    if (roles.includes("doctor")) return "Doctor";
    if (roles.includes("pharmacist")) return "Pharmacist";
    return "Staff";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {isSuperAdmin ? "Super Admin Dashboard" : "Branch Dashboard"}
            </h1>
            <Badge variant="secondary" className="gap-1">
              <Shield className="h-3 w-3" />
              {getRoleDisplay()}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {isSuperAdmin 
              ? "Overview of all Nature Vital Wellness Center branches" 
              : `Welcome back, ${profile?.full_name || "User"}`}
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={isSuperAdmin ? "Total Revenue (Week)" : "Branch Revenue"}
          value={`KES ${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: 8.5, label: "vs last week" }}
          variant="primary"
        />
        <StatsCard
          title={isSuperAdmin ? "Total Patients" : "Branch Patients"}
          value={totalPatients}
          subtitle={isSuperAdmin ? "Across all branches" : "Active patients"}
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
          subtitle={isSuperAdmin ? "All systems operational" : "Branch online"}
          icon={Activity}
          variant="accent"
        />
      </div>

      {/* Super Admin Only - Branch Cards */}
      {isSuperAdmin && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Branch Performance</h2>
            <Badge variant="outline" className="ml-2">4 Branches</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {branches.map((branch) => (
              <BranchCard key={branch.name} {...branch} />
            ))}
          </div>
        </div>
      )}

      {/* Activity and Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <InventoryAlerts />
      </div>

      {/* Super Admin Only - AI Inventory Forecast */}
      {isSuperAdmin && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">AI-Powered Insights</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InventoryForecastWidget />
            <div className="space-y-4">
              <div className="p-6 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-2">Super Admin Responsibilities</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    Monitor all 4 branches in real-time
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    Review aggregated revenue and patient data
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    Predict inventory stockouts across branches
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    Manage Branch Admins, Doctors & Pharmacists
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    Access all patient records system-wide
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

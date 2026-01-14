import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  FileText,
  PieChart,
  Users,
  Package,
  DollarSign,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

const reportTypes = [
  {
    title: "Revenue Report",
    description: "Financial performance across all branches",
    icon: TrendingUp,
    lastGenerated: "Today",
  },
  {
    title: "Patient Analytics",
    description: "Patient flow and demographics analysis",
    icon: PieChart,
    lastGenerated: "Yesterday",
  },
  {
    title: "Inventory Summary",
    description: "Stock levels and movement report",
    icon: BarChart3,
    lastGenerated: "2 days ago",
  },
  {
    title: "Appointment Report",
    description: "Booking trends and utilization",
    icon: Calendar,
    lastGenerated: "Today",
  },
];

const chartConfig = {
  revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
  patients: { label: "Patients", color: "hsl(var(--chart-2))" },
  appointments: { label: "Appointments", color: "hsl(var(--chart-3))" },
  inventory: { label: "Inventory", color: "hsl(var(--chart-4))" },
  pending: { label: "Pending", color: "hsl(var(--chart-5))" },
};

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function Reports() {
  const { isSuperAdmin, profile } = useAuth();

  // Fetch invoices for revenue data
  const { data: invoices = [] } = useQuery({
    queryKey: ["reports-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, branches(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch patients for patient statistics
  const { data: patients = [] } = useQuery({
    queryKey: ["reports-patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*, branches(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch appointments
  const { data: appointments = [] } = useQuery({
    queryKey: ["reports-appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, branches(name)")
        .order("appointment_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch inventory for stock analytics
  const { data: inventory = [] } = useQuery({
    queryKey: ["reports-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_products")
        .select("*, branches(name)")
        .order("stock_quantity", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch branches
  const { data: branches = [] } = useQuery({
    queryKey: ["reports-branches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("branches").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate revenue by branch
  const revenueByBranch = branches.map((branch) => {
    const branchInvoices = invoices.filter((inv) => inv.branch_id === branch.id);
    const totalRevenue = branchInvoices.reduce(
      (sum, inv) => sum + (inv.status === "paid" ? Number(inv.total) || 0 : 0),
      0
    );
    const pendingRevenue = branchInvoices.reduce(
      (sum, inv) => sum + (inv.status === "pending" ? Number(inv.total) || 0 : 0),
      0
    );
    return {
      name: branch.name,
      revenue: totalRevenue,
      pending: pendingRevenue,
    };
  });

  // Calculate revenue trend (last 7 days)
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const revenueTrend = last7Days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayInvoices = invoices.filter(
      (inv) => inv.created_at && inv.created_at.startsWith(dayStr) && inv.status === "paid"
    );
    const revenue = dayInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
    return {
      date: format(day, "EEE"),
      revenue,
    };
  });

  // Patient demographics by gender
  const genderStats = patients.reduce(
    (acc, patient) => {
      const gender = patient.gender || "Unknown";
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const genderData = Object.entries(genderStats).map(([name, value]) => ({
    name,
    value,
  }));

  // Patients by branch
  const patientsByBranch = branches.map((branch) => {
    const count = patients.filter((p) => p.branch_id === branch.id).length;
    return {
      name: branch.name,
      patients: count,
    };
  });

  // Appointment status breakdown
  const appointmentStats = appointments.reduce(
    (acc, apt) => {
      const status = apt.status || "pending";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const appointmentData = Object.entries(appointmentStats).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Inventory by category
  const categoryStats = inventory.reduce(
    (acc, product) => {
      const category = product.category || "Uncategorized";
      acc[category] = (acc[category] || 0) + (product.stock_quantity || 0);
      return acc;
    },
    {} as Record<string, number>
  );

  const categoryData = Object.entries(categoryStats).map(([name, value]) => ({
    name,
    stock: value,
  }));

  // Stock status by branch
  const stockByBranch = branches.map((branch) => {
    const branchProducts = inventory.filter((p) => p.branch_id === branch.id);
    const critical = branchProducts.filter(
      (p) => (p.stock_quantity || 0) <= (p.min_stock_level || 10) * 0.3
    ).length;
    const low = branchProducts.filter(
      (p) =>
        (p.stock_quantity || 0) > (p.min_stock_level || 10) * 0.3 &&
        (p.stock_quantity || 0) <= (p.min_stock_level || 10)
    ).length;
    const good = branchProducts.filter(
      (p) => (p.stock_quantity || 0) > (p.min_stock_level || 10)
    ).length;
    return {
      name: branch.name,
      critical,
      low,
      good,
    };
  });

  // Total stats
  const totalRevenue = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalPatients = patients.length;
  const totalAppointments = appointments.length;
  const lowStockItems = inventory.filter(
    (p) => (p.stock_quantity || 0) <= (p.min_stock_level || 10)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Branch Reports</h1>
          <p className="text-muted-foreground">
            Analytics and insights for all branches
          </p>
        </div>
        <Button className="gap-2">
          <FileText className="h-4 w-4" />
          Custom Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">
                  KES {totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Patients</p>
                <p className="text-2xl font-bold text-foreground">{totalPatients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Appointments</p>
                <p className="text-2xl font-bold text-foreground">{totalAppointments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-destructive/10">
                <Package className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-foreground">{lowStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Revenue Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue by Branch */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Revenue by Branch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={revenueByBranch}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Demographics */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Patient Demographics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <RechartsPie>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {genderData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </RechartsPie>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Patients by Branch */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Patients by Branch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={patientsByBranch} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" className="text-muted-foreground" />
                <YAxis dataKey="name" type="category" width={80} className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="patients" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Appointment Status */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Appointment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <RechartsPie>
                <Pie
                  data={appointmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {appointmentData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </RechartsPie>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock by Category */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Stock by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="stock" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Stock Status by Branch */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Stock Status by Branch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={stockByBranch}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="good" stackId="a" fill="hsl(var(--chart-1))" />
                <Bar dataKey="low" stackId="a" fill="hsl(var(--chart-4))" />
                <Bar dataKey="critical" stackId="a" fill="hsl(var(--destructive))" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((report, index) => (
          <Card
            key={index}
            className="border-border bg-card hover:shadow-md transition-all"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <report.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{report.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {report.description}
                    </p>
                    <Badge variant="outline" className="mt-2">
                      Last: {report.lastGenerated}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Branch Performance */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Branch Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueByBranch.map((branch) => {
              const branchPatients = patients.filter(
                (p) => p.branch_id === branches.find((b) => b.name === branch.name)?.id
              ).length;
              const maxRevenue = Math.max(...revenueByBranch.map((b) => b.revenue), 1);
              const performance = Math.round((branch.revenue / maxRevenue) * 100);

              return (
                <div
                  key={branch.name}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border"
                >
                  <div className="min-w-[100px]">
                    <p className="font-medium text-foreground">{branch.name}</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-3 bg-accent rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${performance}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right min-w-[120px]">
                    <p className="font-bold text-foreground">
                      KES {branch.revenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {branchPatients} patients
                    </p>
                  </div>
                  <Badge variant={performance >= 70 ? "default" : "secondary"}>
                    {performance}%
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

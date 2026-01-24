import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  IndianRupee,
  Package,
  TrendingUp,
  Calendar,
  MapPin,
  Stethoscope,
  Activity,
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export function MobileClinicDashboard() {
  const [dateRange, setDateRange] = useState("today");

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "week":
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
      case "month":
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
      default:
        return { start: startOfDay(now), end: endOfDay(now) };
    }
  };

  const { start, end } = getDateRange();

  // Fetch session statistics
  const { data: sessionStats } = useQuery({
    queryKey: ["mobile-dashboard-sessions", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mobile_sessions")
        .select(`
          id,
          session_date,
          status,
          location:mobile_locations(name, city),
          mobile_unit:mobile_units(name)
        `)
        .gte("session_date", format(start, "yyyy-MM-dd"))
        .lte("session_date", format(end, "yyyy-MM-dd"));
      if (error) throw error;
      return data;
    },
  });

  // Fetch appointment statistics
  const { data: appointmentStats } = useQuery({
    queryKey: ["mobile-dashboard-appointments", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mobile_appointments")
        .select(`
          id,
          status,
          session:mobile_sessions!inner(
            session_date,
            location:mobile_locations(city)
          )
        `)
        .gte("session.session_date", format(start, "yyyy-MM-dd"))
        .lte("session.session_date", format(end, "yyyy-MM-dd"));
      if (error) throw error;
      return data;
    },
  });

  // Fetch revenue data
  const { data: revenueData } = useQuery({
    queryKey: ["mobile-dashboard-revenue", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mobile_session_invoices")
        .select(`
          id,
          consultation_fee,
          medicine_total,
          total_amount,
          payment_status,
          created_at,
          session:mobile_sessions!inner(
            session_date,
            location:mobile_locations(city)
          )
        `)
        .gte("session.session_date", format(start, "yyyy-MM-dd"))
        .lte("session.session_date", format(end, "yyyy-MM-dd"));
      if (error) throw error;
      return data;
    },
  });

  // Fetch dispensing data
  const { data: dispensingData } = useQuery({
    queryKey: ["mobile-dashboard-dispensing", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mobile_dispensing")
        .select(`
          id,
          quantity,
          total_price,
          dispensed_at,
          product:inventory_products(name, category)
        `)
        .gte("dispensed_at", start.toISOString())
        .lte("dispensed_at", end.toISOString());
      if (error) throw error;
      return data;
    },
  });

  // Calculate statistics
  const totalPatients = appointmentStats?.filter(a => a.status === "completed").length || 0;
  const totalRevenue = revenueData?.filter(r => r.payment_status === "paid")
    .reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;
  const consultationRevenue = revenueData?.filter(r => r.payment_status === "paid")
    .reduce((sum, r) => sum + (r.consultation_fee || 0), 0) || 0;
  const medicineRevenue = revenueData?.filter(r => r.payment_status === "paid")
    .reduce((sum, r) => sum + (r.medicine_total || 0), 0) || 0;
  const itemsDispensed = dispensingData?.reduce((sum, d) => sum + d.quantity, 0) || 0;
  const activeSessions = sessionStats?.filter(s => s.status === "in_progress" || s.status === "completed").length || 0;

  // Revenue by city
  const revenueByCity = revenueData?.reduce((acc: any, inv) => {
    const city = inv.session?.location?.city || "Unknown";
    if (!acc[city]) acc[city] = 0;
    acc[city] += inv.total_amount || 0;
    return acc;
  }, {});

  const cityChartData = Object.entries(revenueByCity || {}).map(([city, revenue]) => ({
    city,
    revenue,
  }));

  // Appointment status distribution
  const statusCounts = appointmentStats?.reduce((acc: any, apt) => {
    acc[apt.status] = (acc[apt.status] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = Object.entries(statusCounts || {}).map(([status, count]) => ({
    name: status.replace("_", " "),
    value: count,
  }));

  // Top dispensed products
  const productCounts = dispensingData?.reduce((acc: any, d) => {
    const name = d.product?.name || "Unknown";
    if (!acc[name]) acc[name] = { quantity: 0, revenue: 0 };
    acc[name].quantity += d.quantity;
    acc[name].revenue += d.total_price || 0;
    return acc;
  }, {});

  const topProducts = Object.entries(productCounts || {})
    .map(([name, data]: any) => ({ name, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Mobile Clinic Dashboard
        </h2>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Patients Seen</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              {activeSessions} sessions active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Consultations: ₹{consultationRevenue.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Medicine Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{medicineRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {itemsDispensed} items dispensed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Items Dispensed</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{itemsDispensed}</div>
            <p className="text-xs text-muted-foreground">
              {topProducts.length} unique products
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue by City */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Revenue by City
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cityChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="city" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    formatter={(value: any) => [`₹${value.toLocaleString()}`, "Revenue"]}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointment Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Appointment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Today's Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionStats?.slice(0, 5).map((session: any) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {session.location?.city}
                    </TableCell>
                    <TableCell>{session.mobile_unit?.name}</TableCell>
                    <TableCell>
                      <Badge variant={session.status === "completed" ? "default" : "secondary"}>
                        {session.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {!sessionStats?.length && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No sessions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Dispensed Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Top Dispensed Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product: any) => (
                  <TableRow key={product.name}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">{product.quantity}</TableCell>
                    <TableCell className="text-right">₹{product.revenue.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {!topProducts.length && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No products dispensed
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

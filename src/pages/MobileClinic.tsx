import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Calendar, Package, Plus } from "lucide-react";
import { MobileUnitsTab } from "@/components/mobile-clinic/MobileUnitsTab";
import { LocationsTab } from "@/components/mobile-clinic/LocationsTab";
import { RouteCalendar } from "@/components/mobile-clinic/RouteCalendar";
import { InventoryTransfersTab } from "@/components/mobile-clinic/InventoryTransfersTab";

export default function MobileClinic() {
  const { isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("calendar");

  const { data: stats } = useQuery({
    queryKey: ["mobile-clinic-stats"],
    queryFn: async () => {
      const [unitsRes, locationsRes, sessionsRes, transfersRes] = await Promise.all([
        supabase.from("mobile_units").select("id", { count: "exact" }).eq("is_active", true),
        supabase.from("mobile_locations").select("id", { count: "exact" }).eq("is_active", true),
        supabase.from("mobile_sessions").select("id", { count: "exact" }).eq("status", "scheduled"),
        supabase.from("mobile_inventory_transfers").select("id", { count: "exact" }).eq("status", "pending"),
      ]);
      return {
        activeUnits: unitsRes.count || 0,
        locations: locationsRes.count || 0,
        scheduledSessions: sessionsRes.count || 0,
        pendingTransfers: transfersRes.count || 0,
      };
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mobile Clinic</h1>
          <p className="text-muted-foreground">Manage traveling doctors, routes, and inventory</p>
        </div>
        {isSuperAdmin && (
          <Badge variant="outline" className="text-sm">
            Super Admin View
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Units</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeUnits || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.locations || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.scheduledSessions || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Transfers</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingTransfers || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="calendar">Route Calendar</TabsTrigger>
          <TabsTrigger value="units">Mobile Units</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="transfers">Inventory Transfers</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <RouteCalendar />
        </TabsContent>

        <TabsContent value="units" className="mt-4">
          <MobileUnitsTab />
        </TabsContent>

        <TabsContent value="locations" className="mt-4">
          <LocationsTab />
        </TabsContent>

        <TabsContent value="transfers" className="mt-4">
          <InventoryTransfersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, MapPin } from "lucide-react";
import { AddLocationDialog } from "./AddLocationDialog";

interface Location {
  id: string;
  name: string;
  city: string;
  address: string | null;
  contact_phone: string | null;
  is_active: boolean;
}

export function LocationsTab() {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: locations, refetch } = useQuery({
    queryKey: ["mobile-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mobile_locations")
        .select("*")
        .order("city")
        .order("name");

      if (error) throw error;
      return data as Location[];
    },
  });

  const handleToggleStatus = async (location: Location) => {
    try {
      const { error } = await supabase
        .from("mobile_locations")
        .update({ is_active: !location.is_active })
        .eq("id", location.id);

      if (error) throw error;
      toast({ title: `Location ${location.is_active ? "deactivated" : "activated"}` });
      refetch();
    } catch (error: any) {
      toast({ title: "Error updating location", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Clinic Locations
        </CardTitle>
        {isSuperAdmin && (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations?.map((location) => (
              <TableRow key={location.id}>
                <TableCell className="font-medium">{location.name}</TableCell>
                <TableCell>{location.city}</TableCell>
                <TableCell>{location.address || "-"}</TableCell>
                <TableCell>{location.contact_phone || "-"}</TableCell>
                <TableCell>
                  <Badge variant={location.is_active ? "default" : "secondary"}>
                    {location.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                {isSuperAdmin && (
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(location)}
                    >
                      {location.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {(!locations || locations.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No locations found. Add one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <AddLocationDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onLocationAdded={refetch}
      />
    </Card>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Truck, Edit, Trash2 } from "lucide-react";
import { AddMobileUnitDialog } from "./AddMobileUnitDialog";

interface MobileUnit {
  id: string;
  name: string;
  vehicle_registration: string | null;
  is_active: boolean;
  home_branch: { id: string; name: string } | null;
  assigned_doctor: { id: string; full_name: string } | null;
}

export function MobileUnitsTab() {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: units, refetch } = useQuery({
    queryKey: ["mobile-units"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mobile_units")
        .select(`
          id,
          name,
          vehicle_registration,
          is_active,
          home_branch:branches(id, name),
          assigned_doctor:profiles!mobile_units_assigned_doctor_id_fkey(id, full_name)
        `)
        .order("name");

      if (error) throw error;
      return data as unknown as MobileUnit[];
    },
  });

  const handleToggleStatus = async (unit: MobileUnit) => {
    try {
      const { error } = await supabase
        .from("mobile_units")
        .update({ is_active: !unit.is_active })
        .eq("id", unit.id);

      if (error) throw error;
      toast({ title: `Unit ${unit.is_active ? "deactivated" : "activated"}` });
      refetch();
    } catch (error: any) {
      toast({ title: "Error updating unit", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Mobile Units
        </CardTitle>
        {isSuperAdmin && (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Unit
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit Name</TableHead>
              <TableHead>Vehicle Registration</TableHead>
              <TableHead>Home Branch</TableHead>
              <TableHead>Assigned Doctor</TableHead>
              <TableHead>Status</TableHead>
              {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {units?.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell className="font-medium">{unit.name}</TableCell>
                <TableCell>{unit.vehicle_registration || "-"}</TableCell>
                <TableCell>{unit.home_branch?.name || "-"}</TableCell>
                <TableCell>{unit.assigned_doctor?.full_name || "Unassigned"}</TableCell>
                <TableCell>
                  <Badge variant={unit.is_active ? "default" : "secondary"}>
                    {unit.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                {isSuperAdmin && (
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(unit)}
                    >
                      {unit.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {(!units || units.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No mobile units found. Add one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <AddMobileUnitDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onUnitAdded={refetch}
      />
    </Card>
  );
}

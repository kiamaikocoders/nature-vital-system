import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Package, ArrowRight } from "lucide-react";
import { CreateTransferDialog } from "./CreateTransferDialog";
import { format } from "date-fns";

interface Transfer {
  id: string;
  quantity: number;
  status: string;
  transfer_date: string;
  notes: string | null;
  from_branch: { id: string; name: string } | null;
  to_mobile_unit: { id: string; name: string } | null;
  product: { id: string; name: string; product_code: string } | null;
  transferred_by_profile: { id: string; full_name: string } | null;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "outline",
  transferred: "default",
  returned: "destructive",
};

export function InventoryTransfersTab() {
  const { isSuperAdmin, profile } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: transfers, refetch } = useQuery({
    queryKey: ["mobile-inventory-transfers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mobile_inventory_transfers")
        .select(`
          id,
          quantity,
          status,
          transfer_date,
          notes,
          from_branch:branches!mobile_inventory_transfers_from_branch_id_fkey(id, name),
          to_mobile_unit:mobile_units(id, name),
          product:inventory_products(id, name, product_code),
          transferred_by_profile:profiles!mobile_inventory_transfers_transferred_by_fkey(id, full_name)
        `)
        .order("transfer_date", { ascending: false });

      if (error) throw error;
      return data as unknown as Transfer[];
    },
  });

  const handleUpdateStatus = async (transfer: Transfer, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("mobile_inventory_transfers")
        .update({ status: newStatus })
        .eq("id", transfer.id);

      if (error) throw error;

      // If transferred, update mobile unit inventory
      if (newStatus === "transferred" && transfer.to_mobile_unit && transfer.product) {
        const { data: existing } = await supabase
          .from("mobile_unit_inventory")
          .select("id, quantity")
          .eq("mobile_unit_id", transfer.to_mobile_unit.id)
          .eq("product_id", transfer.product.id)
          .single();

        if (existing) {
          await supabase
            .from("mobile_unit_inventory")
            .update({ quantity: existing.quantity + transfer.quantity })
            .eq("id", existing.id);
        } else {
          await supabase.from("mobile_unit_inventory").insert({
            mobile_unit_id: transfer.to_mobile_unit.id,
            product_id: transfer.product.id,
            quantity: transfer.quantity,
          });
        }

        // Reduce branch inventory
        const { data: branchProduct } = await supabase
          .from("inventory_products")
          .select("stock_quantity")
          .eq("id", transfer.product.id)
          .single();

        if (branchProduct) {
          await supabase
            .from("inventory_products")
            .update({ stock_quantity: Math.max(0, branchProduct.stock_quantity - transfer.quantity) })
            .eq("id", transfer.product.id);
        }
      }

      toast({ title: `Transfer status updated to ${newStatus}` });
      refetch();
    } catch (error: any) {
      toast({ title: "Error updating transfer", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Inventory Transfers
        </CardTitle>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Transfer
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>From Branch</TableHead>
              <TableHead></TableHead>
              <TableHead>To Mobile Unit</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers?.map((transfer) => (
              <TableRow key={transfer.id}>
                <TableCell>
                  {format(new Date(transfer.transfer_date), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{transfer.product?.name || "-"}</div>
                  <div className="text-xs text-muted-foreground">
                    {transfer.product?.product_code}
                  </div>
                </TableCell>
                <TableCell>{transfer.from_branch?.name || "-"}</TableCell>
                <TableCell>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
                <TableCell>{transfer.to_mobile_unit?.name || "-"}</TableCell>
                <TableCell>{transfer.quantity}</TableCell>
                <TableCell>
                  <Badge variant={statusColors[transfer.status] || "secondary"}>
                    {transfer.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {transfer.status === "pending" && (
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateStatus(transfer, "approved")}
                      >
                        Approve
                      </Button>
                    </div>
                  )}
                  {transfer.status === "approved" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateStatus(transfer, "transferred")}
                    >
                      Mark Transferred
                    </Button>
                  )}
                  {transfer.status === "transferred" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateStatus(transfer, "returned")}
                    >
                      Return
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {(!transfers || transfers.length === 0) && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No transfers found. Create one to move inventory to mobile units.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <CreateTransferDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onTransferCreated={refetch}
      />
    </Card>
  );
}

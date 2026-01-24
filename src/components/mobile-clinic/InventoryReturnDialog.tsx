import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Undo2 } from "lucide-react";

interface InventoryReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReturnCreated: () => void;
}

export function InventoryReturnDialog({
  open,
  onOpenChange,
  onReturnCreated,
}: InventoryReturnDialogProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  // Fetch mobile units
  const { data: mobileUnits } = useQuery({
    queryKey: ["mobile-units-for-return"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mobile_units")
        .select(`
          id,
          name,
          home_branch_id,
          home_branch:branches(id, name)
        `)
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch mobile unit inventory
  const { data: unitInventory } = useQuery({
    queryKey: ["unit-inventory-return", selectedUnit],
    queryFn: async () => {
      if (!selectedUnit) return [];
      const { data, error } = await supabase
        .from("mobile_unit_inventory")
        .select(`
          id,
          quantity,
          product:inventory_products(id, name, product_code)
        `)
        .eq("mobile_unit_id", selectedUnit)
        .gt("quantity", 0);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedUnit,
  });

  const selectedUnitData = mobileUnits?.find((u) => u.id === selectedUnit);
  const selectedInventory = unitInventory?.find(
    (inv: any) => inv.product?.id === selectedProduct
  );

  const returnMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUnit || !selectedProduct || !selectedUnitData) {
        throw new Error("Please select unit and product");
      }

      if (!selectedInventory || quantity > selectedInventory.quantity) {
        throw new Error("Insufficient stock in mobile unit");
      }

      // Create a return transfer record (using negative transfer concept)
      const { error: transferError } = await supabase
        .from("mobile_inventory_transfers")
        .insert({
          from_branch_id: selectedUnitData.home_branch_id,
          to_mobile_unit_id: selectedUnit,
          product_id: selectedProduct,
          quantity: -quantity, // Negative to indicate return
          status: "returned",
          notes: `RETURN: ${notes || "Stock returned from mobile unit"}`,
          transferred_by: user?.id,
        });
      if (transferError) throw transferError;

      // Reduce mobile unit inventory
      const newUnitQty = Math.max(0, selectedInventory.quantity - quantity);
      const { error: unitError } = await supabase
        .from("mobile_unit_inventory")
        .update({ quantity: newUnitQty, last_updated: new Date().toISOString() })
        .eq("id", selectedInventory.id);
      if (unitError) throw unitError;

      // Add back to branch inventory
      const { data: branchProduct } = await supabase
        .from("inventory_products")
        .select("id, stock_quantity")
        .eq("id", selectedProduct)
        .single();

      if (branchProduct) {
        await supabase
          .from("inventory_products")
          .update({ 
            stock_quantity: (branchProduct.stock_quantity || 0) + quantity,
            updated_at: new Date().toISOString()
          })
          .eq("id", branchProduct.id);
      }
    },
    onSuccess: () => {
      toast.success("Stock returned to home branch successfully");
      queryClient.invalidateQueries({ queryKey: ["mobile-inventory-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["unit-inventory-return"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      resetForm();
      onReturnCreated();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to process return");
    },
  });

  const resetForm = () => {
    setSelectedUnit("");
    setSelectedProduct("");
    setQuantity(1);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="h-5 w-5" />
            Return Stock to Branch
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Mobile Unit</Label>
            <Select value={selectedUnit} onValueChange={(v) => {
              setSelectedUnit(v);
              setSelectedProduct("");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select mobile unit" />
              </SelectTrigger>
              <SelectContent>
                {mobileUnits?.map((unit: any) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name} → {unit.home_branch?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedUnitData?.home_branch && (
              <p className="text-xs text-muted-foreground mt-1">
                Will return to: {selectedUnitData.home_branch.name}
              </p>
            )}
          </div>

          <div>
            <Label>Product to Return</Label>
            <Select 
              value={selectedProduct} 
              onValueChange={setSelectedProduct}
              disabled={!selectedUnit}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedUnit ? "Select product" : "Select unit first"} />
              </SelectTrigger>
              <SelectContent>
                {unitInventory?.map((inv: any) => (
                  <SelectItem key={inv.product?.id} value={inv.product?.id}>
                    {inv.product?.name} (Available: {inv.quantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Quantity to Return</Label>
            <Input
              type="number"
              min={1}
              max={selectedInventory?.quantity || 1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
            {selectedInventory && (
              <p className="text-xs text-muted-foreground mt-1">
                Max available: {selectedInventory.quantity}
              </p>
            )}
          </div>

          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Reason for return..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => returnMutation.mutate()}
            disabled={!selectedUnit || !selectedProduct || quantity < 1 || returnMutation.isPending}
          >
            {returnMutation.isPending ? "Processing..." : "Return Stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

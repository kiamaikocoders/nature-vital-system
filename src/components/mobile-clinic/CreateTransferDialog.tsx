import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface CreateTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferCreated: () => void;
}

export function CreateTransferDialog({ open, onOpenChange, onTransferCreated }: CreateTransferDialogProps) {
  const { toast } = useToast();
  const { profile, isSuperAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    from_branch_id: "",
    to_mobile_unit_id: "",
    product_id: "",
    quantity: "",
    notes: "",
  });

  const { data: branches } = useQuery({
    queryKey: ["branches-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: mobileUnits } = useQuery({
    queryKey: ["mobile-units-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mobile_units")
        .select("id, name")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const selectedBranchId = formData.from_branch_id || (isSuperAdmin ? "" : profile?.branch_id);

  const { data: products } = useQuery({
    queryKey: ["branch-products", selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const { data, error } = await supabase
        .from("inventory_products")
        .select("id, name, product_code, stock_quantity")
        .eq("branch_id", selectedBranchId)
        .gt("stock_quantity", 0)
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBranchId,
  });

  const selectedProduct = products?.find((p) => p.id === formData.product_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const branchId = formData.from_branch_id || profile?.branch_id;
    
    if (!branchId || !formData.to_mobile_unit_id || !formData.product_id || !formData.quantity) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const qty = parseInt(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      toast({ title: "Please enter a valid quantity", variant: "destructive" });
      return;
    }

    if (selectedProduct && qty > selectedProduct.stock_quantity) {
      toast({ title: "Quantity exceeds available stock", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("mobile_inventory_transfers").insert({
        from_branch_id: branchId,
        to_mobile_unit_id: formData.to_mobile_unit_id,
        product_id: formData.product_id,
        quantity: qty,
        transferred_by: profile?.id,
        notes: formData.notes || null,
      });

      if (error) throw error;

      toast({ title: "Transfer request created" });
      onTransferCreated();
      onOpenChange(false);
      setFormData({ from_branch_id: "", to_mobile_unit_id: "", product_id: "", quantity: "", notes: "" });
    } catch (error: any) {
      toast({ title: "Error creating transfer", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Inventory Transfer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSuperAdmin && (
            <div className="space-y-2">
              <Label>From Branch *</Label>
              <Select
                value={formData.from_branch_id}
                onValueChange={(value) => setFormData({ ...formData, from_branch_id: value, product_id: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches?.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>To Mobile Unit *</Label>
            <Select
              value={formData.to_mobile_unit_id}
              onValueChange={(value) => setFormData({ ...formData, to_mobile_unit_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select destination unit" />
              </SelectTrigger>
              <SelectContent>
                {mobileUnits?.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Product *</Label>
            <Select
              value={formData.product_id}
              onValueChange={(value) => setFormData({ ...formData, product_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} ({product.stock_quantity} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quantity *</Label>
            <Input
              type="number"
              min="1"
              max={selectedProduct?.stock_quantity || 9999}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="Enter quantity"
            />
            {selectedProduct && (
              <p className="text-xs text-muted-foreground">
                Available: {selectedProduct.stock_quantity} units
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Transfer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

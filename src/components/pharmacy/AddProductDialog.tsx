import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded: () => void;
}

const categories = [
  "Detox",
  "Supplements",
  "Brain Health",
  "Immunity",
  "Heart",
  "Digestive",
  "Energy",
  "Sleep",
];

export function AddProductDialog({ open, onOpenChange, onProductAdded }: AddProductDialogProps) {
  const { profile, isSuperAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    product_code: "",
    category: "",
    description: "",
    price: "",
    stock_quantity: "",
    min_stock_level: "10",
    batch_number: "",
    expiry_date: "",
    branch_id: "",
  });

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category) {
      toast.error("Please fill in required fields");
      return;
    }

    const branchId = isSuperAdmin ? formData.branch_id : profile?.branch_id;
    if (!branchId) {
      toast.error("Branch assignment required");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("inventory_products").insert({
        name: formData.name,
        product_code: formData.product_code || null,
        category: formData.category,
        description: formData.description || null,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        min_stock_level: parseInt(formData.min_stock_level) || 10,
        batch_number: formData.batch_number || null,
        expiry_date: formData.expiry_date || null,
        branch_id: branchId,
      });

      if (error) throw error;

      toast.success("Product added successfully");
      setFormData({
        name: "",
        product_code: "",
        category: "",
        description: "",
        price: "",
        stock_quantity: "",
        min_stock_level: "10",
        batch_number: "",
        expiry_date: "",
        branch_id: "",
      });
      onProductAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Add a new product to the pharmacy inventory
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., VitalCal Plus"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product_code">Product Code</Label>
                <Input
                  id="product_code"
                  value={formData.product_code}
                  onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                  placeholder="e.g., NV007"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price (KES) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="stock_quantity">Initial Stock</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="min_stock_level">Min Stock Level</Label>
                <Input
                  id="min_stock_level"
                  type="number"
                  min="0"
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                  placeholder="10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="batch_number">Batch Number</Label>
                <Input
                  id="batch_number"
                  value={formData.batch_number}
                  onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  placeholder="BATCH001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>
              {isSuperAdmin && (
                <div className="grid gap-2">
                  <Label htmlFor="branch">Branch *</Label>
                  <Select
                    value={formData.branch_id}
                    onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches?.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

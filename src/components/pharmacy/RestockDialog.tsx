import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface RestockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    stock: number;
    minStock: number;
  } | null;
  onRestock: (productId: string, quantity: number) => void;
}

export function RestockDialog({ open, onOpenChange, product, onRestock }: RestockDialogProps) {
  const [quantity, setQuantity] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    setIsLoading(true);
    try {
      await onRestock(product.id, qty);
      toast.success(`Restocked ${qty} units of ${product.name}`);
      setQuantity("");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to restock product");
    } finally {
      setIsLoading(false);
    }
  };

  if (!product) return null;

  const suggestedRestock = Math.max(0, (product.minStock * 3) - product.stock);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Restock Product</DialogTitle>
          <DialogDescription>
            Add inventory for {product.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Current Stock</Label>
              <p className="text-2xl font-bold text-foreground">{product.stock} units</p>
              <p className="text-sm text-muted-foreground">Minimum stock level: {product.minStock}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity to Add</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={`Suggested: ${suggestedRestock}`}
              />
              {suggestedRestock > 0 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setQuantity(suggestedRestock.toString())}
                >
                  Use suggested: {suggestedRestock} units
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Restocking..." : "Confirm Restock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

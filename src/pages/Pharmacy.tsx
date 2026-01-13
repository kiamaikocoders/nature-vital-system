import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Package, AlertTriangle, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { RestockDialog } from "@/components/pharmacy/RestockDialog";
import { AddProductDialog } from "@/components/pharmacy/AddProductDialog";
import { InventoryForecastWidget } from "@/components/dashboard/InventoryForecastWidget";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const statusColors = {
  Good: "bg-primary/10 text-primary",
  Low: "bg-accent text-accent-foreground",
  Critical: "bg-destructive/10 text-destructive",
};

export default function Pharmacy() {
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [restockDialogOpen, setRestockDialogOpen] = useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [forecastDialogOpen, setForecastDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    name: string;
    stock: number;
    minStock: number;
  } | null>(null);

  const { data: products = [], refetch } = useQuery({
    queryKey: ["inventory-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_products")
        .select("*, branches(name)")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data.map(p => ({
        ...p,
        branch: p.branches?.name || "Unknown",
        status: p.stock_quantity! <= (p.min_stock_level! * 0.3) ? "Critical" 
              : p.stock_quantity! <= p.min_stock_level! ? "Low" 
              : "Good"
      }));
    },
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.product_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRestock = async (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const { error } = await supabase
      .from("inventory_products")
      .update({ stock_quantity: (product.stock_quantity || 0) + quantity })
      .eq("id", productId);

    if (error) throw error;
    refetch();
  };

  const openRestockDialog = (product: typeof products[0]) => {
    setSelectedProduct({
      id: product.id,
      name: product.name,
      stock: product.stock_quantity || 0,
      minStock: product.min_stock_level || 10,
    });
    setRestockDialogOpen(true);
  };

  const lowStockCount = products.filter(p => p.status === "Low" || p.status === "Critical").length;
  const criticalCount = products.filter(p => p.status === "Critical").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pharmacy Inventory</h1>
          <p className="text-muted-foreground">Nature-Vital Product Management</p>
        </div>
        <div className="flex gap-2">
          {isSuperAdmin && (
            <Button variant="outline" className="gap-2" onClick={() => setForecastDialogOpen(true)}>
              <TrendingUp className="h-4 w-4" />
              Forecast
            </Button>
          )}
          <Button className="gap-2" onClick={() => setAddProductDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{products.length}</p>
                <p className="text-sm text-muted-foreground">Total Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{criticalCount}</p>
                <p className="text-sm text-muted-foreground">Critical Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <TrendingUp className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{lowStockCount}</p>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(products.map(p => p.category)).size}
                </p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <CardTitle className="text-lg font-semibold">Product Inventory</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search products..." 
                className="pl-10" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Price (KES)</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No products found" : "No products in inventory. Add your first product!"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const stockPercent = ((product.stock_quantity || 0) / ((product.min_stock_level || 10) * 3)) * 100;
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-sm">{product.product_code || "-"}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category || "Uncategorized"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 w-32">
                          <div className="flex justify-between text-xs">
                            <span>{product.stock_quantity || 0}</span>
                            <span className="text-muted-foreground">min: {product.min_stock_level || 10}</span>
                          </div>
                          <Progress value={Math.min(100, stockPercent)} className="h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell>{Number(product.price).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.branch}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[product.status as keyof typeof statusColors]}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openRestockDialog(product)}
                        >
                          Restock
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <RestockDialog
        open={restockDialogOpen}
        onOpenChange={setRestockDialogOpen}
        product={selectedProduct}
        onRestock={handleRestock}
      />

      <AddProductDialog
        open={addProductDialogOpen}
        onOpenChange={setAddProductDialogOpen}
        onProductAdded={() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
        }}
      />

      <Dialog open={forecastDialogOpen} onOpenChange={setForecastDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Inventory Forecast</DialogTitle>
          </DialogHeader>
          <InventoryForecastWidget />
        </DialogContent>
      </Dialog>
    </div>
  );
}

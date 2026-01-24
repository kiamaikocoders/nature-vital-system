import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, AlertTriangle, Truck } from "lucide-react";
import { format } from "date-fns";

export function MobileUnitInventoryTab() {
  const [selectedUnit, setSelectedUnit] = useState<string>("all");

  const { data: units } = useQuery({
    queryKey: ["mobile-units-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mobile_units")
        .select("id, name, vehicle_registration")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const { data: inventory } = useQuery({
    queryKey: ["mobile-unit-inventory", selectedUnit],
    queryFn: async () => {
      let query = supabase
        .from("mobile_unit_inventory")
        .select(`
          id,
          quantity,
          last_updated,
          mobile_unit:mobile_units(id, name, vehicle_registration),
          product:inventory_products(id, name, category, min_stock_level, expiry_date)
        `)
        .order("quantity", { ascending: true });

      if (selectedUnit !== "all") {
        query = query.eq("mobile_unit_id", selectedUnit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Group inventory by mobile unit
  const groupedInventory = inventory?.reduce((acc: any, item: any) => {
    const unitId = item.mobile_unit?.id;
    if (!unitId) return acc;

    if (!acc[unitId]) {
      acc[unitId] = {
        unit: item.mobile_unit,
        items: [],
        totalItems: 0,
        lowStockCount: 0,
      };
    }

    acc[unitId].items.push(item);
    acc[unitId].totalItems += item.quantity || 0;

    if (item.product?.min_stock_level && item.quantity < item.product.min_stock_level) {
      acc[unitId].lowStockCount++;
    }

    return acc;
  }, {});

  const getStockStatus = (quantity: number, minLevel: number) => {
    if (quantity === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" };
    if (quantity < minLevel) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" };
    return { label: "In Stock", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Mobile Unit Inventory
        </h3>
        <Select value={selectedUnit} onValueChange={setSelectedUnit}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filter by unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Units</SelectItem>
            {units?.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>
                {unit.name} ({unit.vehicle_registration})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!groupedInventory || Object.keys(groupedInventory).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No inventory found in mobile units.
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedInventory).map(([unitId, data]: [string, any]) => (
          <Card key={unitId}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-4 w-4" />
                  {data.unit.name}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({data.unit.vehicle_registration})
                  </span>
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">
                    {data.items.length} Products
                  </Badge>
                  <Badge variant="outline">
                    {data.totalItems} Total Units
                  </Badge>
                  {data.lowStockCount > 0 && (
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      {data.lowStockCount} Low Stock
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item: any) => {
                    const status = getStockStatus(
                      item.quantity || 0,
                      item.product?.min_stock_level || 10
                    );
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.product?.name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.product?.category || "N/A"}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {item.quantity}
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {item.product?.expiry_date
                            ? format(new Date(item.product.expiry_date), "MMM d, yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.last_updated
                            ? format(new Date(item.last_updated), "MMM d, HH:mm")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

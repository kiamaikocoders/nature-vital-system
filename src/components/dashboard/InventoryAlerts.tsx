import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Package } from "lucide-react";

const products = [
  { name: "PureFlow Detox", stock: 12, maxStock: 100, branch: "Machakos", critical: true },
  { name: "VitalCal Plus", stock: 25, maxStock: 150, branch: "Mlolongo", critical: true },
  { name: "NeuroVital", stock: 45, maxStock: 100, branch: "Matuu", critical: false },
  { name: "Super Detox", stock: 8, maxStock: 80, branch: "Tala Town", critical: true },
  { name: "ImmunoBoost", stock: 60, maxStock: 120, branch: "Machakos", critical: false },
];

export function InventoryAlerts() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Inventory Alerts
          </CardTitle>
          <Badge variant="destructive" className="text-xs">
            {products.filter(p => p.critical).length} Critical
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.map((product, index) => {
          const percentage = (product.stock / product.maxStock) * 100;
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {product.critical && (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-sm font-medium text-foreground">{product.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{product.branch}</span>
                  <Badge variant={product.critical ? "destructive" : "secondary"} className="text-xs">
                    {product.stock} units
                  </Badge>
                </div>
              </div>
              <Progress 
                value={percentage} 
                className={`h-2 ${product.critical ? '[&>div]:bg-destructive' : ''}`}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

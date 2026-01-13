import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface BranchCardProps {
  name: string;
  location: string;
  revenue: number;
  patients: number;
  trend: number;
  status: "online" | "offline" | "syncing";
}

export function BranchCard({ name, location, revenue, patients, trend, status }: BranchCardProps) {
  const statusColors = {
    online: "bg-primary text-primary-foreground",
    offline: "bg-destructive text-destructive-foreground",
    syncing: "bg-accent text-accent-foreground",
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">{name}</CardTitle>
            <p className="text-sm text-muted-foreground">{location}</p>
          </div>
          <Badge className={cn("capitalize", statusColors[status])}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Revenue</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              KES {revenue.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-xs">Patients</span>
            </div>
            <p className="text-xl font-bold text-foreground">{patients}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <TrendingUp className={cn(
            "h-4 w-4",
            trend >= 0 ? "text-primary" : "text-destructive"
          )} />
          <span className={cn(
            "text-sm font-medium",
            trend >= 0 ? "text-primary" : "text-destructive"
          )}>
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
          <span className="text-sm text-muted-foreground">vs last week</span>
        </div>
      </CardContent>
    </Card>
  );
}

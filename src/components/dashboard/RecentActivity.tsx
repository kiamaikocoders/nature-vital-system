import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Pill, Receipt } from "lucide-react";

const activities = [
  {
    id: 1,
    type: "patient",
    message: "New patient registered",
    details: "John Mwangi - Machakos Branch",
    time: "2 min ago",
    icon: User,
  },
  {
    id: 2,
    type: "pharmacy",
    message: "Low stock alert",
    details: "VitalCal - 15 units left at Mlolongo",
    time: "15 min ago",
    icon: Pill,
  },
  {
    id: 3,
    type: "billing",
    message: "Payment received",
    details: "KES 4,500 - Consultation + Supplements",
    time: "32 min ago",
    icon: Receipt,
  },
  {
    id: 4,
    type: "patient",
    message: "Appointment completed",
    details: "Mary Wanjiku - Tala Town Branch",
    time: "1 hour ago",
    icon: User,
  },
  {
    id: 5,
    type: "pharmacy",
    message: "Stock replenished",
    details: "PureFlow - 200 units added at Matuu",
    time: "2 hours ago",
    icon: Pill,
  },
];

const typeColors = {
  patient: "bg-primary/10 text-primary",
  pharmacy: "bg-accent text-accent-foreground",
  billing: "bg-secondary/10 text-secondary-foreground",
};

export function RecentActivity() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
          <Badge variant="outline" className="text-xs">
            Live Updates
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/30 transition-colors">
            <div className={`p-2 rounded-lg ${typeColors[activity.type as keyof typeof typeColors]}`}>
              <activity.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{activity.message}</p>
              <p className="text-sm text-muted-foreground truncate">{activity.details}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {activity.time}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Download, Calendar, FileText, PieChart } from "lucide-react";

const reportTypes = [
  { title: "Revenue Report", description: "Financial performance across all branches", icon: TrendingUp, lastGenerated: "Today" },
  { title: "Patient Analytics", description: "Patient flow and demographics analysis", icon: PieChart, lastGenerated: "Yesterday" },
  { title: "Inventory Summary", description: "Stock levels and movement report", icon: BarChart3, lastGenerated: "2 days ago" },
  { title: "Appointment Report", description: "Booking trends and utilization", icon: Calendar, lastGenerated: "Today" },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Branch Reports</h1>
          <p className="text-muted-foreground">Analytics and insights for all branches</p>
        </div>
        <Button className="gap-2">
          <FileText className="h-4 w-4" />
          Custom Report
        </Button>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((report, index) => (
          <Card key={index} className="border-border bg-card hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <report.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{report.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                    <Badge variant="outline" className="mt-2">
                      Last: {report.lastGenerated}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Branch Comparison */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Branch Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Machakos", revenue: 245000, patients: 156, performance: 85 },
              { name: "Mlolongo", revenue: 189000, patients: 98, performance: 72 },
              { name: "Matuu", revenue: 134000, patients: 72, performance: 58 },
              { name: "Tala Town", revenue: 167000, patients: 84, performance: 68 },
            ].map((branch) => (
              <div key={branch.name} className="flex items-center gap-4 p-4 rounded-lg border border-border">
                <div className="min-w-[100px]">
                  <p className="font-medium text-foreground">{branch.name}</p>
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-accent rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${branch.performance}%` }}
                    />
                  </div>
                </div>
                <div className="text-right min-w-[120px]">
                  <p className="font-bold text-foreground">KES {branch.revenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{branch.patients} patients</p>
                </div>
                <Badge variant={branch.performance >= 70 ? "default" : "secondary"}>
                  {branch.performance}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Receipt, DollarSign, CreditCard, Clock } from "lucide-react";

const invoices = [
  { id: "INV001", patient: "John Mwangi", date: "2024-01-10", items: "Consultation + VitalCal", amount: 5500, status: "Paid", branch: "Machakos" },
  { id: "INV002", patient: "Mary Wanjiku", date: "2024-01-09", items: "Consultation", amount: 2000, status: "Paid", branch: "Mlolongo" },
  { id: "INV003", patient: "Peter Ochieng", date: "2024-01-08", items: "Consultation + Super Detox + NeuroVital", amount: 8000, status: "Pending", branch: "Matuu" },
  { id: "INV004", patient: "Grace Akinyi", date: "2024-01-07", items: "Consultation + PureFlow", amount: 4500, status: "Paid", branch: "Tala Town" },
  { id: "INV005", patient: "David Kiprop", date: "2024-01-05", items: "Follow-up + ImmunoBoost", amount: 2500, status: "Overdue", branch: "Machakos" },
];

export default function Billing() {
  const totalRevenue = invoices.filter(i => i.status === "Paid").reduce((sum, i) => sum + i.amount, 0);
  const pendingAmount = invoices.filter(i => i.status !== "Paid").reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing & Revenue</h1>
          <p className="text-muted-foreground">Invoice management and payment tracking</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">KES {totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <Clock className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">KES {pendingAmount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{invoices.length}</p>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">M-Pesa</p>
                <p className="text-sm text-muted-foreground">Primary Method</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <CardTitle className="text-lg font-semibold">Recent Invoices</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search invoices..." className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Amount (KES)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-sm">{invoice.id}</TableCell>
                  <TableCell className="font-medium">{invoice.patient}</TableCell>
                  <TableCell className="text-muted-foreground">{invoice.date}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{invoice.items}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{invoice.branch}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{invoice.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={invoice.status === "Paid" ? "default" : invoice.status === "Pending" ? "secondary" : "destructive"}
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

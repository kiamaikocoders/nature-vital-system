import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Receipt, DollarSign, CreditCard, Clock } from "lucide-react";
import { CreateInvoiceDialog } from "@/components/billing/CreateInvoiceDialog";
import { ViewInvoiceDialog } from "@/components/billing/ViewInvoiceDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export default function Billing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<{
    id: string;
    patient: string;
    date: string;
    items: string;
    amount: number;
    status: string;
    branch: string;
  } | null>(null);

  const { data: invoicesData = [], refetch } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          patients(first_name, last_name),
          branches(name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const invoices = invoicesData.map(inv => {
    const items = Array.isArray(inv.items) 
      ? (inv.items as { name: string }[]).map(i => i.name).join(", ")
      : "Items";
    
    return {
      id: inv.invoice_number || inv.id.slice(0, 8),
      realId: inv.id,
      patient: inv.patients ? `${inv.patients.first_name} ${inv.patients.last_name}` : "Walk-in",
      date: inv.created_at ? format(new Date(inv.created_at), "yyyy-MM-dd") : "",
      items,
      amount: Number(inv.total) || 0,
      status: inv.status === "paid" ? "Paid" : inv.status === "pending" ? "Pending" : "Overdue",
      branch: inv.branches?.name || "Unknown",
    };
  });

  const filteredInvoices = invoices.filter(inv =>
    inv.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = invoices.filter(i => i.status === "Paid").reduce((sum, i) => sum + i.amount, 0);
  const pendingAmount = invoices.filter(i => i.status !== "Paid").reduce((sum, i) => sum + i.amount, 0);

  const openViewDialog = (inv: typeof invoices[0]) => {
    setSelectedInvoice({
      id: inv.realId,
      patient: inv.patient,
      date: inv.date,
      items: inv.items,
      amount: inv.amount,
      status: inv.status,
      branch: inv.branch,
    });
    setViewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing & Revenue</h1>
          <p className="text-muted-foreground">Invoice management and payment tracking</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
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
              <Input 
                placeholder="Search invoices..." 
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
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No invoices found" : "No invoices yet. Create your first invoice!"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.realId}>
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
                      <Button variant="outline" size="sm" onClick={() => openViewDialog(invoice)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateInvoiceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onInvoiceCreated={refetch}
      />

      <ViewInvoiceDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        invoice={selectedInvoice}
        onStatusChange={refetch}
      />
    </div>
  );
}

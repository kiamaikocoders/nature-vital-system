import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, User, Calendar, CreditCard, Printer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface ViewInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    patient: string;
    date: string;
    items: string;
    amount: number;
    status: string;
    branch: string;
  } | null;
  onStatusChange?: () => void;
}

export function ViewInvoiceDialog({ open, onOpenChange, invoice, onStatusChange }: ViewInvoiceDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!invoice) return null;

  const statusColors: Record<string, string> = {
    Paid: "bg-primary text-primary-foreground",
    Pending: "bg-secondary text-secondary-foreground",
    Overdue: "bg-destructive text-destructive-foreground",
  };

  const handleMarkPaid = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "paid", paid_at: new Date().toISOString(), payment_method: "M-Pesa" })
        .eq("id", invoice.id);
      
      if (error) throw error;
      toast.success("Invoice marked as paid");
      onStatusChange?.();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update invoice");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrint = () => {
    toast.success("Preparing invoice for printing...");
    // In a real app, this would open a print dialog
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Invoice {invoice.id}
          </DialogTitle>
          <DialogDescription>
            Invoice details and payment status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Banner */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{invoice.patient}</p>
                <p className="text-sm text-muted-foreground">{invoice.branch}</p>
              </div>
            </div>
            <Badge className={statusColors[invoice.status]}>
              {invoice.status}
            </Badge>
          </div>

          {/* Invoice Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium text-foreground">{invoice.date}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-2">Items</p>
              <p className="text-sm text-foreground">{invoice.items}</p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">Total Amount</span>
              </div>
              <span className="text-2xl font-bold text-primary">
                KES {invoice.amount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          {invoice.status !== "Paid" && (
            <Button onClick={handleMarkPaid} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Mark as Paid"}
            </Button>
          )}
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

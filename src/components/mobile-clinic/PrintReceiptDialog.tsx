import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer, X } from "lucide-react";
import { format } from "date-fns";

interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface PrintReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptData: {
    invoiceNumber?: string;
    patientName: string;
    patientCode: string;
    sessionLocation: string;
    sessionDate: string;
    doctorName?: string;
    items: ReceiptItem[];
    consultationFee: number;
    medicineTotal: number;
    grandTotal: number;
    paymentMethod: string;
    paidAt: string;
  } | null;
}

export function PrintReceiptDialog({
  open,
  onOpenChange,
  receiptData,
}: PrintReceiptDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;

    const printContent = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=400,height=600");
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                padding: 10mm;
                max-width: 80mm;
                margin: 0 auto;
              }
              .receipt-header { text-align: center; margin-bottom: 16px; }
              .receipt-header h1 { font-size: 16px; margin-bottom: 4px; }
              .receipt-header p { font-size: 10px; color: #666; }
              .divider { border-top: 1px dashed #333; margin: 12px 0; }
              .patient-info { margin-bottom: 12px; }
              .patient-info p { margin-bottom: 4px; }
              .items-table { width: 100%; margin: 12px 0; }
              .items-table th, .items-table td { text-align: left; padding: 4px 0; }
              .items-table th:last-child, .items-table td:last-child { text-align: right; }
              .items-table th:nth-child(2), .items-table td:nth-child(2) { text-align: center; }
              .totals { margin-top: 12px; }
              .totals .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
              .totals .grand { font-weight: bold; font-size: 14px; border-top: 1px solid #333; padding-top: 8px; margin-top: 8px; }
              .footer { text-align: center; margin-top: 16px; font-size: 10px; color: #666; }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() { window.close(); }
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (!receiptData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Receipt
          </DialogTitle>
        </DialogHeader>

        <div className="border rounded-lg p-4 bg-background">
          <div ref={printRef}>
            {/* Receipt Header */}
            <div className="receipt-header text-center mb-4">
              <h1 className="font-bold text-lg">NatureVital Clinic</h1>
              <p className="text-xs text-muted-foreground">Mobile Health Services</p>
              <p className="text-xs text-muted-foreground">{receiptData.sessionLocation}</p>
            </div>

            <div className="divider border-t border-dashed border-border my-3" />

            {/* Invoice Info */}
            <div className="text-xs space-y-1 mb-3">
              <p><strong>Receipt #:</strong> {receiptData.invoiceNumber || "N/A"}</p>
              <p><strong>Date:</strong> {format(new Date(receiptData.paidAt), "dd/MM/yyyy HH:mm")}</p>
              <p><strong>Session:</strong> {format(new Date(receiptData.sessionDate), "dd/MM/yyyy")}</p>
            </div>

            <div className="divider border-t border-dashed border-border my-3" />

            {/* Patient Info */}
            <div className="patient-info text-xs space-y-1 mb-3">
              <p><strong>Patient:</strong> {receiptData.patientName}</p>
              <p><strong>Code:</strong> {receiptData.patientCode}</p>
              {receiptData.doctorName && (
                <p><strong>Doctor:</strong> {receiptData.doctorName}</p>
              )}
            </div>

            <div className="divider border-t border-dashed border-border my-3" />

            {/* Items */}
            {receiptData.items.length > 0 && (
              <>
                <table className="items-table w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1">Item</th>
                      <th className="text-center py-1">Qty</th>
                      <th className="text-right py-1">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptData.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-1">{item.name}</td>
                        <td className="text-center py-1">{item.quantity}</td>
                        <td className="text-right py-1">KES {item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="divider border-t border-dashed border-border my-3" />
              </>
            )}

            {/* Totals */}
            <div className="totals text-xs space-y-1">
              <div className="flex justify-between">
                <span>Consultation Fee:</span>
                <span>KES {receiptData.consultationFee.toLocaleString()}</span>
              </div>
              {receiptData.medicineTotal > 0 && (
                <div className="flex justify-between">
                  <span>Medicines:</span>
                  <span>KES {receiptData.medicineTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm border-t border-border pt-2 mt-2">
                <span>TOTAL:</span>
                <span>KES {receiptData.grandTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Payment:</span>
                <span className="capitalize">{receiptData.paymentMethod}</span>
              </div>
            </div>

            <div className="divider border-t border-dashed border-border my-3" />

            {/* Footer */}
            <div className="footer text-center text-xs text-muted-foreground">
              <p>Thank you for choosing NatureVital!</p>
              <p className="mt-1">Get well soon 🌿</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

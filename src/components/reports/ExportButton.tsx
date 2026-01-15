import { useState } from "react";
import { Download, FileText, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface ExportData {
  revenueByBranch: { name: string; revenue: number; pending: number }[];
  patientsByBranch: { name: string; patients: number }[];
  categoryData: { name: string; stock: number }[];
  summary: {
    totalRevenue: number;
    totalPatients: number;
    totalAppointments: number;
    lowStockItems: number;
  };
}

interface ExportButtonProps {
  data: ExportData;
  dateRange?: { from?: Date; to?: Date };
}

export function ExportButton({ data, dateRange }: ExportButtonProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const generateCSV = () => {
    const lines: string[] = [];
    const dateRangeStr = dateRange?.from && dateRange?.to 
      ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
      : "All Time";

    // Header
    lines.push(`NatureVital Reports Export - ${dateRangeStr}`);
    lines.push("");

    // Summary
    lines.push("SUMMARY");
    lines.push(`Total Revenue,KES ${data.summary.totalRevenue.toLocaleString()}`);
    lines.push(`Total Patients,${data.summary.totalPatients}`);
    lines.push(`Total Appointments,${data.summary.totalAppointments}`);
    lines.push(`Low Stock Items,${data.summary.lowStockItems}`);
    lines.push("");

    // Revenue by Branch
    lines.push("REVENUE BY BRANCH");
    lines.push("Branch,Revenue (KES),Pending (KES)");
    data.revenueByBranch.forEach((row) => {
      lines.push(`${row.name},${row.revenue},${row.pending}`);
    });
    lines.push("");

    // Patients by Branch
    lines.push("PATIENTS BY BRANCH");
    lines.push("Branch,Patients");
    data.patientsByBranch.forEach((row) => {
      lines.push(`${row.name},${row.patients}`);
    });
    lines.push("");

    // Inventory by Category
    lines.push("INVENTORY BY CATEGORY");
    lines.push("Category,Stock");
    data.categoryData.forEach((row) => {
      lines.push(`${row.name},${row.stock}`);
    });

    return lines.join("\n");
  };

  const generatePDFContent = () => {
    const dateRangeStr = dateRange?.from && dateRange?.to 
      ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
      : "All Time";

    // Create a simple HTML document for printing as PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>NatureVital Reports</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          h1 { color: #166534; border-bottom: 2px solid #166534; padding-bottom: 10px; }
          h2 { color: #166534; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f0fdf4; }
          .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
          .summary-card { background: #f0fdf4; padding: 20px; border-radius: 8px; }
          .summary-card h3 { margin: 0; color: #666; font-size: 14px; }
          .summary-card p { margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #166534; }
          .date-range { color: #666; margin-bottom: 30px; }
        </style>
      </head>
      <body>
        <h1>NatureVital Reports</h1>
        <p class="date-range">Period: ${dateRangeStr}</p>
        
        <div class="summary-grid">
          <div class="summary-card">
            <h3>Total Revenue</h3>
            <p>KES ${data.summary.totalRevenue.toLocaleString()}</p>
          </div>
          <div class="summary-card">
            <h3>Total Patients</h3>
            <p>${data.summary.totalPatients}</p>
          </div>
          <div class="summary-card">
            <h3>Total Appointments</h3>
            <p>${data.summary.totalAppointments}</p>
          </div>
          <div class="summary-card">
            <h3>Low Stock Items</h3>
            <p>${data.summary.lowStockItems}</p>
          </div>
        </div>

        <h2>Revenue by Branch</h2>
        <table>
          <thead><tr><th>Branch</th><th>Revenue (KES)</th><th>Pending (KES)</th></tr></thead>
          <tbody>
            ${data.revenueByBranch.map(r => `<tr><td>${r.name}</td><td>${r.revenue.toLocaleString()}</td><td>${r.pending.toLocaleString()}</td></tr>`).join("")}
          </tbody>
        </table>

        <h2>Patients by Branch</h2>
        <table>
          <thead><tr><th>Branch</th><th>Patients</th></tr></thead>
          <tbody>
            ${data.patientsByBranch.map(r => `<tr><td>${r.name}</td><td>${r.patients}</td></tr>`).join("")}
          </tbody>
        </table>

        <h2>Inventory by Category</h2>
        <table>
          <thead><tr><th>Category</th><th>Stock</th></tr></thead>
          <tbody>
            ${data.categoryData.map(r => `<tr><td>${r.name}</td><td>${r.stock}</td></tr>`).join("")}
          </tbody>
        </table>

        <p style="margin-top: 40px; color: #999; font-size: 12px;">
          Generated on ${new Date().toLocaleString()}
        </p>
      </body>
      </html>
    `;

    return html;
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const csv = generateCSV();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `naturevital-report-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: "Export Successful",
        description: "CSV report downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate CSV report",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const html = generatePDFContent();
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
        toast({
          title: "PDF Ready",
          description: "Print dialog opened - save as PDF",
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2" disabled={isExporting}>
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover border-border">
        <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
          <FileText className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer">
          <Table className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

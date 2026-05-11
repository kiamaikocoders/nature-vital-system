import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

const modules = [
  {
    name: "Super Admin Dashboard & RBAC",
    description: "Centralized multi-branch monitoring, aggregated analytics, and AI-powered inventory forecasting for enhanced administrative control.",
    cost: 60000,
  },
  {
    name: "Multi-Branch Patient EHR",
    description: "Comprehensive clinical workflows, patient history, and vital signs tracking with secure data isolation across all branches.",
    cost: 80000,
  },
  {
    name: "Inventory & Pharmacy Management",
    description: "Real-time stock tracking, batch management, and automated low-stock alerts to optimize pharmacy operations.",
    cost: 50000,
  },
  {
    name: "Billing & Invoicing",
    description: "Financial tracking of M-Pesa and cash payments with professional itemized invoicing.",
    cost: 30000,
  },
  {
    name: "Mobile Clinic Operations",
    description: "Advanced management of mobile units, recurring routes, field check-ins, on-site dispensing, and inventory returns.",
    cost: 45000,
  },
  {
    name: "Technical Infrastructure",
    description: "Secure cloud backend, Row-Level Security implementation, and responsive cross-device design.",
    cost: 35000,
  },
];

const timeline = [
  { phase: "Foundation (Auth / Database / RBAC)", duration: "2 weeks" },
  { phase: "Core Modules (EHR / Inventory / Billing)", duration: "2.5 weeks" },
  { phase: "Mobile Clinic System", duration: "1.5 weeks" },
  { phase: "Deployment & Training", duration: "1 week" },
];

export default function ProjectInvoice() {
  const navigate = useNavigate();
  const totalAmount = modules.reduce((sum, m) => sum + m.cost, 0);
  const invoiceDate = new Date().toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const invoiceNumber = `NV-HIS-${new Date().getFullYear()}-001`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-background border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print / Save PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="max-w-4xl mx-auto p-8 print:p-0 print:max-w-none">
        <div className="bg-background rounded-lg shadow-lg print:shadow-none print:rounded-none">
          {/* Invoice Content */}
          <div className="p-8 print:p-12 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-border pb-6">
              <div className="flex items-center gap-4">
                <img src={logo} alt="Nature Vital" className="h-16 w-16 object-contain" />
                <div>
                  <h1 className="text-2xl font-bold text-primary">Nature Vital Wellness Center</h1>
                  <p className="text-muted-foreground">Hospital Information System</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-bold text-foreground">INVOICE</h2>
                <p className="text-muted-foreground mt-1">#{invoiceNumber}</p>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Bill To:</h3>
                <p className="text-foreground font-medium">Nature Vital Wellness Center</p>
                <p className="text-muted-foreground">Machakos, Kenya</p>
                <p className="text-muted-foreground">Multi-Branch Operations:</p>
                <p className="text-muted-foreground text-sm">1. Wote &bull; Machakos &bull; Kitui &bull; Matuu &bull; Mlolongo &bull; Mobile Units</p>
              </div>
              <div className="text-right">
                <div className="space-y-1">
                  <p><span className="text-muted-foreground">Invoice Date:</span> <span className="font-medium text-foreground">{invoiceDate}</span></p>
                  <p><span className="text-muted-foreground">Due Date:</span> <span className="font-medium text-foreground">Upon Delivery</span></p>
                  <p><span className="text-muted-foreground">Project Duration:</span> <span className="font-medium text-foreground">7 Weeks</span></p>
                </div>
              </div>
            </div>

            {/* Project Description */}
            <div className="bg-accent/30 rounded-lg p-4 print:bg-gray-50">
              <h3 className="font-semibold text-foreground mb-2">Project Description</h3>
              <p className="text-muted-foreground text-sm">
                Comprehensive Hospital Information System designed to streamline operations across multiple branches. 
                The system enhances patient care, inventory management, billing, and administrative oversight with 
                advanced mobile clinic capabilities for extended healthcare reach.
              </p>
            </div>

            {/* Modules Table */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Development Modules</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-primary/20">
                    <th className="text-left py-3 text-foreground font-semibold">Module</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map((module, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="py-4">
                        <p className="font-medium text-foreground">{module.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-primary">
                    <td className="py-4 text-lg font-bold text-foreground">
                      Total Amount: <span className="text-primary">KES {totalAmount.toLocaleString()}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Implementation Timeline</h3>
              <div className="grid grid-cols-2 gap-4">
                {timeline.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="font-medium text-foreground text-sm">{item.phase}</p>
                      <p className="text-xs text-muted-foreground">{item.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Terms */}
            <div className="border-t border-border pt-6">
              <h3 className="font-semibold text-foreground mb-4">Payment Terms & Conditions</h3>
              <div className="grid grid-cols-2 gap-8 text-sm">
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Payment Structure:</span>
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                    <li>40% upon project commencement</li>
                    <li>30% upon core modules delivery</li>
                    <li>30% upon final deployment & training</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Accepted Payment Methods:</span>
                  </p>
                  <div className="text-muted-foreground space-y-2 ml-2">
                    <div>
                      <p className="font-medium text-foreground text-sm">M-Pesa Direct:</p>
                      <p className="text-sm">Send to: <span className="font-mono">0757218793</span></p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">M-Pesa Paybill (Loop):</p>
                      <p className="text-sm">Business No: <span className="font-mono">714777</span></p>
                      <p className="text-sm">Account No: <span className="font-mono">0757218793</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deliverables */}
            <div className="bg-accent/30 rounded-lg p-4 print:bg-muted/30">
              <h3 className="font-semibold text-foreground mb-3">Project Deliverables Include:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <p>✓ Complete source code ownership</p>
                <p>✓ Cloud hosting setup</p>
                <p>✓ Database configuration</p>
                <p>✓ User training sessions</p>
                <p>✓ Technical documentation</p>
                <p>✓ 3-month support period</p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border pt-6 text-center">
              <p className="text-muted-foreground text-sm">
                Thank you for choosing our services. For inquiries, please contact:
              </p>
              <p className="text-foreground font-medium text-sm mt-1">
                komuzack@gmail.com
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                This invoice was generated on {invoiceDate} | Nature Vital HIS v1.0
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0.5in;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

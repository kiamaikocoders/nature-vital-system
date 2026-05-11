import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

const phases = [
  {
    name: "Phase 1 — Patient Data Intake (Reception)",
    duration: "Weeks 1–2",
    cost: 70000,
    summary: "Reception-led patient registration and identification flow, ensuring accurate tracking of new and returning patients across all branches.",
    deliverables: [
      "Patient registration form with demographics, contacts and next of kin capture",
      "Returning vs. new patient detection (search by name, phone, ID)",
      "Unified patient profile with visit history and branch tagging",
      "Reception dashboard for daily intake and queue handover to doctor",
      "Secure multi-branch data isolation (RLS)",
    ],
    acceptance: [
      "Reception can register a new patient in under 2 minutes with all required fields validated",
      "Searching an existing patient returns the correct profile with full visit history",
      "Registered patient appears instantly on the doctor's queue for the correct branch",
      "Users from one branch cannot view or edit patients of another branch",
    ],
  },
  {
    name: "Phase 2 — Doctor Clinical Flow",
    duration: "Weeks 3–4",
    cost: 90000,
    summary: "Doctor receives patients from reception, reviews history, performs diagnosis, classifies severity, and prescribes medication forwarded to pharmacy.",
    deliverables: [
      "Doctor queue showing patients checked in by reception",
      "Full patient EHR view: history, vitals, allergies, past visits",
      "New visit form: complaints, examination, vitals capture",
      "Diagnosis with severity classification (Mild / Moderate / Severe)",
      "Treatment & prescription builder forwarded directly to pharmacy",
      "Clinical timeline of every encounter per patient",
    ],
    acceptance: [
      "Doctor can open a queued patient and view complete history within one click",
      "A visit can be recorded with vitals, diagnosis, severity and prescription saved together",
      "Submitted prescription appears on the pharmacy queue in real time",
      "Clinical timeline reflects every past visit in chronological order",
    ],
  },
  {
    name: "Phase 3 — Pharmacy & Stock Management",
    duration: "Weeks 5–6",
    cost: 80000,
    summary: "Two parallel flows under pharmacy: (a) dispensing to patients based on doctor's prescription, and (b) stock/logistics management for restocking and availability.",
    deliverables: [
      "Pharmacy queue receiving patient + diagnosis + prescription from doctor",
      "Dispensing flow with quantity, batch and patient acknowledgement",
      "Automatic stock deduction on dispensing & dispensing record per patient",
      "Stock management module: add new products, restock, top-ups",
      "Real-time availability view (in-stock / low-stock / out-of-stock)",
      "Batch tracking, expiry alerts and low-stock notifications",
      "Itemized invoicing & M-Pesa payment recording on dispense",
    ],
    acceptance: [
      "Pharmacist sees prescriptions immediately after the doctor submits them",
      "Dispensing a medicine reduces stock by the exact quantity issued",
      "Restock and top-up entries update availability in real time across the system",
      "Low-stock and expiry alerts trigger automatically at defined thresholds",
      "Each dispense produces an itemized invoice with payment recorded against the patient",
    ],
  },
  {
    name: "Phase 4 — Super Admin Dashboard & Oversight",
    duration: "Week 7",
    cost: 60000,
    summary: "Centralized command center giving the Super Admin full visibility and CRUD control across every branch, user, patient, prescription, stock and payment.",
    deliverables: [
      "Aggregated multi-branch KPIs: patients, revenue, stock, appointments",
      "Full CRUD on users, roles, branches, patients, inventory and invoices",
      "Cross-branch reporting with custom date ranges and export",
      "AI-powered inventory forecasting and stockout predictions",
      "Audit trail and real-time activity monitoring",
      "Mobile clinic oversight: units, routes, field dispensing & returns",
      "Deployment, go-live and full team training",
    ],
    acceptance: [
      "Super Admin dashboard shows live KPIs aggregated across all branches",
      "Super Admin can create, update and deactivate users, roles and branches",
      "Reports can be filtered by custom date ranges and exported successfully",
      "Inventory forecasting flags upcoming stockouts based on real sales velocity",
      "All staff are trained and the system is signed off as live in production",
    ],
  },
];

export default function ProjectInvoice() {
  const navigate = useNavigate();
  const totalAmount = phases.reduce((sum, p) => sum + p.cost, 0);
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
                <h2 className="text-3xl font-bold text-foreground">PROJECT BREAKDOWN</h2>
                <p className="text-muted-foreground mt-1">Ref #{invoiceNumber}</p>
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

            {/* Phased Delivery */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Phased Project Delivery</h3>
              <div className="space-y-4">
                {phases.map((phase, index) => (
                  <div key={index} className="rounded-lg border border-border p-4 print:break-inside-avoid">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <p className="font-semibold text-foreground">{phase.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{phase.duration}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{phase.summary}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">Deliverables</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-1">
                          {phase.deliverables.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">Acceptance Criteria (Definition of Done)</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-1">
                          {phase.acceptance.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t-2 border-primary pt-4">
                  <p className="text-lg font-bold text-foreground text-right">
                    Total Project Cost: <span className="text-primary">KES {totalAmount.toLocaleString()}</span>
                  </p>
                </div>
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

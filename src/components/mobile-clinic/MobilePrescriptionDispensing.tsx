import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pill,
  Plus,
  Trash2,
  Printer,
  Check,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { PrintReceiptDialog } from "./PrintReceiptDialog";

interface PrescriptionItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  availableStock: number;
}

export function MobilePrescriptionDispensing() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showDispenseDialog, setShowDispenseDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [consultationFee, setConsultationFee] = useState(500);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Fetch today's sessions
  const { data: todaySessions } = useQuery({
    queryKey: ["today-sessions-dispensing"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("mobile_sessions")
        .select(`
          id,
          session_date,
          start_time,
          end_time,
          status,
          mobile_unit_id,
          location:mobile_locations(name, city),
          mobile_unit:mobile_units(id, name)
        `)
        .eq("session_date", today)
        .in("status", ["scheduled", "in_progress"]);
      if (error) throw error;
      return data;
    },
  });

  // Fetch completed appointments for dispensing
  const { data: appointments } = useQuery({
    queryKey: ["completed-appointments", selectedSession],
    queryFn: async () => {
      if (!selectedSession) return [];
      const { data, error } = await supabase
        .from("mobile_appointments")
        .select(`
          id,
          appointment_time,
          status,
          treatment,
          prescriptions,
          patient:patients(id, first_name, last_name, patient_code)
        `)
        .eq("session_id", selectedSession)
        .in("status", ["completed", "in_progress"])
        .order("appointment_time");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedSession,
  });

  // Get mobile unit ID from session
  const currentSession = todaySessions?.find(s => s.id === selectedSession);
  const mobileUnitId = currentSession?.mobile_unit_id;

  // Fetch mobile unit inventory
  const { data: unitInventory } = useQuery({
    queryKey: ["unit-inventory-dispensing", mobileUnitId],
    queryFn: async () => {
      if (!mobileUnitId) return [];
      const { data, error } = await supabase
        .from("mobile_unit_inventory")
        .select(`
          id,
          quantity,
          product:inventory_products(id, name, price, category)
        `)
        .eq("mobile_unit_id", mobileUnitId)
        .gt("quantity", 0);
      if (error) throw error;
      return data;
    },
    enabled: !!mobileUnitId,
  });

  // Fetch existing dispensed items for appointment
  const { data: dispensedItems, refetch: refetchDispensed } = useQuery({
    queryKey: ["dispensed-items", selectedAppointment?.id],
    queryFn: async () => {
      if (!selectedAppointment) return [];
      const { data, error } = await supabase
        .from("mobile_dispensing")
        .select(`
          id,
          quantity,
          unit_price,
          total_price,
          product:inventory_products(id, name)
        `)
        .eq("appointment_id", selectedAppointment.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedAppointment?.id,
  });

  // Add item to prescription
  const addToPrescription = () => {
    if (!selectedProduct || quantity < 1) return;

    const inventoryItem = unitInventory?.find(
      (inv: any) => inv.product?.id === selectedProduct
    );
    if (!inventoryItem) return;

    const existing = prescriptionItems.find(p => p.productId === selectedProduct);
    const currentQty = existing?.quantity || 0;
    
    if (currentQty + quantity > inventoryItem.quantity) {
      toast.error(`Only ${inventoryItem.quantity - currentQty} units available`);
      return;
    }

    if (existing) {
      setPrescriptionItems(prev =>
        prev.map(p =>
          p.productId === selectedProduct
            ? {
                ...p,
                quantity: p.quantity + quantity,
                totalPrice: (p.quantity + quantity) * p.unitPrice,
              }
            : p
        )
      );
    } else {
      setPrescriptionItems(prev => [
        ...prev,
        {
          productId: selectedProduct,
          productName: inventoryItem.product.name,
          quantity,
          unitPrice: inventoryItem.product.price,
          totalPrice: quantity * inventoryItem.product.price,
          availableStock: inventoryItem.quantity,
        },
      ]);
    }

    setSelectedProduct("");
    setQuantity(1);
    toast.success("Item added to prescription");
  };

  const removeFromPrescription = (productId: string) => {
    setPrescriptionItems(prev => prev.filter(p => p.productId !== productId));
  };

  // Dispense mutation
  const dispenseMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAppointment || !mobileUnitId) throw new Error("Missing data");

      // Get current session
      const session = todaySessions?.find(s => s.id === selectedSession);
      if (!session) throw new Error("Session not found");

      const medicineTotal = prescriptionItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const totalAmount = consultationFee + medicineTotal;

      // Insert dispensing records and update inventory
      for (const item of prescriptionItems) {
        // Add dispensing record
        const { error: dispenseError } = await supabase
          .from("mobile_dispensing")
          .insert({
            appointment_id: selectedAppointment.id,
            product_id: item.productId,
            mobile_unit_id: mobileUnitId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.totalPrice,
            dispensed_by: user?.id,
          });
        if (dispenseError) throw dispenseError;

        // Deduct from mobile unit inventory
        const { data: invRecord } = await supabase
          .from("mobile_unit_inventory")
          .select("id, quantity")
          .eq("mobile_unit_id", mobileUnitId)
          .eq("product_id", item.productId)
          .single();

        if (invRecord) {
          const newQty = Math.max(0, invRecord.quantity - item.quantity);
          await supabase
            .from("mobile_unit_inventory")
            .update({ quantity: newQty, last_updated: new Date().toISOString() })
            .eq("id", invRecord.id);
        }
      }

      // Create session invoice
      const { error: invoiceError } = await supabase
        .from("mobile_session_invoices")
        .insert({
          session_id: selectedSession,
          appointment_id: selectedAppointment.id,
          patient_id: selectedAppointment.patient.id,
          consultation_fee: consultationFee,
          medicine_total: medicineTotal,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          payment_status: "paid",
          paid_at: new Date().toISOString(),
        });
      if (invoiceError) throw invoiceError;

      // Update appointment prescriptions
      await supabase
        .from("mobile_appointments")
        .update({
          prescriptions: prescriptionItems.map(p => ({
            product_id: p.productId,
            name: p.productName,
            quantity: p.quantity,
            price: p.totalPrice,
          })),
        })
        .eq("id", selectedAppointment.id);
    },
    onSuccess: () => {
      toast.success("Prescription dispensed and payment recorded");
      queryClient.invalidateQueries({ queryKey: ["unit-inventory-dispensing"] });
      queryClient.invalidateQueries({ queryKey: ["dispensed-items"] });
      
      // Prepare receipt data
      const session = todaySessions?.find(s => s.id === selectedSession);
      const receipt = {
        invoiceNumber: `MCR-${Date.now().toString().slice(-8)}`,
        patientName: `${selectedAppointment.patient?.first_name} ${selectedAppointment.patient?.last_name}`,
        patientCode: selectedAppointment.patient?.patient_code || "N/A",
        sessionLocation: `${session?.location?.name}, ${session?.location?.city}`,
        sessionDate: session?.session_date,
        items: prescriptionItems.map(p => ({
          name: p.productName,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
          total: p.totalPrice,
        })),
        consultationFee,
        medicineTotal,
        grandTotal,
        paymentMethod,
        paidAt: new Date().toISOString(),
      };
      setReceiptData(receipt);
      
      setShowDispenseDialog(false);
      setShowPrintDialog(true);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to dispense");
    },
  });

  const resetForm = () => {
    setPrescriptionItems([]);
    setSelectedProduct("");
    setQuantity(1);
    setConsultationFee(500);
    setPaymentMethod("cash");
    setSelectedAppointment(null);
  };

  const openDispenseDialog = (appointment: any) => {
    setSelectedAppointment(appointment);
    setPrescriptionItems([]);
    setShowDispenseDialog(true);
  };

  const medicineTotal = prescriptionItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const grandTotal = consultationFee + medicineTotal;

  return (
    <div className="space-y-4">
      {/* Session Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Prescription Dispensing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger>
              <SelectValue placeholder="Select today's session" />
            </SelectTrigger>
            <SelectContent>
              {todaySessions?.map((session: any) => (
                <SelectItem key={session.id} value={session.id}>
                  {session.location?.city} - {session.mobile_unit?.name} ({session.start_time?.slice(0, 5)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Completed Appointments */}
      {selectedSession && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Patients Ready for Dispensing</CardTitle>
          </CardHeader>
          <CardContent>
            {!appointments?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No completed consultations yet
              </p>
            ) : (
              <div className="space-y-2">
                {appointments.map((apt: any) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        {apt.patient?.first_name} {apt.patient?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {apt.patient?.patient_code} • {apt.appointment_time?.slice(0, 5)}
                      </div>
                      {apt.treatment && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          Rx: {apt.treatment}
                        </p>
                      )}
                    </div>
                    <Button size="sm" onClick={() => openDispenseDialog(apt)}>
                      <Package className="mr-1 h-4 w-4" />
                      Dispense
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dispense Dialog */}
      <Dialog open={showDispenseDialog} onOpenChange={setShowDispenseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Dispense Prescription - {selectedAppointment?.patient?.first_name}{" "}
              {selectedAppointment?.patient?.last_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Treatment reference */}
            {selectedAppointment?.treatment && (
              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-xs text-muted-foreground">Doctor's Prescription</Label>
                <p className="text-sm mt-1">{selectedAppointment.treatment}</p>
              </div>
            )}

            {/* Add medicine */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-6">
                <Label className="text-xs">Medicine</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select medicine" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitInventory?.map((inv: any) => (
                      <SelectItem key={inv.product?.id} value={inv.product?.id}>
                        {inv.product?.name} (Stock: {inv.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <Label className="text-xs">Qty</Label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="col-span-3 flex items-end">
                <Button onClick={addToPrescription} className="w-full">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Prescription items table */}
            {prescriptionItems.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescriptionItems.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">KES {item.unitPrice}</TableCell>
                      <TableCell className="text-right">KES {item.totalPrice}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromPrescription(item.productId)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Billing summary */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Consultation Fee</Label>
                <Input
                  type="number"
                  className="w-24 text-right"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Medicine Total</span>
                <span>KES {medicineTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between font-bold text-lg border-t pt-2">
                <span>Grand Total</span>
                <span>KES {grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Label>Payment</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDispenseDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => dispenseMutation.mutate()}
              disabled={dispenseMutation.isPending}
            >
              <Check className="mr-2 h-4 w-4" />
              Dispense & Collect KES {grandTotal.toFixed(2)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Receipt Dialog */}
      <PrintReceiptDialog
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
        receiptData={receiptData}
      />
    </div>
  );
}

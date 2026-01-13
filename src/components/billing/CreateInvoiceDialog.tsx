import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceCreated: () => void;
}

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
}

export function CreateInvoiceDialog({ open, onOpenChange, onInvoiceCreated }: CreateInvoiceDialogProps) {
  const { profile, isSuperAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([{ name: "", quantity: 1, price: 0 }]);

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const selectedBranchId = isSuperAdmin ? branchId : profile?.branch_id;

  const { data: patients } = useQuery({
    queryKey: ["patients", selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name, patient_code")
        .eq("branch_id", selectedBranchId)
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBranchId,
  });

  const { data: products } = useQuery({
    queryKey: ["products", selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const { data, error } = await supabase
        .from("inventory_products")
        .select("id, name, price")
        .eq("branch_id", selectedBranchId)
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBranchId,
  });

  const addItem = () => {
    setItems([...items, { name: "", quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    if (field === "name") {
      const product = products?.find(p => p.name === value);
      newItems[index] = { 
        ...newItems[index], 
        name: value as string,
        price: product?.price || newItems[index].price
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const tax = subtotal * 0.16; // 16% VAT
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientId) {
      toast.error("Please select a patient");
      return;
    }

    if (items.some(item => !item.name || item.price <= 0)) {
      toast.error("Please fill in all item details");
      return;
    }

    const finalBranchId = isSuperAdmin ? branchId : profile?.branch_id;
    if (!finalBranchId) {
      toast.error("Branch assignment required");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("invoices").insert([{
        patient_id: patientId,
        branch_id: finalBranchId,
        items: items as unknown as Json,
        subtotal,
        tax,
        total,
        status: "pending",
      }]);


      if (error) throw error;

      toast.success("Invoice created successfully");
      setPatientId("");
      setBranchId("");
      setItems([{ name: "", quantity: 1, price: 0 }]);
      onInvoiceCreated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>
            Generate an invoice for a patient
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {isSuperAdmin && (
              <div className="grid gap-2">
                <Label>Branch *</Label>
                <Select value={branchId} onValueChange={(v) => { setBranchId(v); setPatientId(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Patient *</Label>
              <Select 
                value={patientId} 
                onValueChange={setPatientId}
                disabled={isSuperAdmin && !branchId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients?.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name} ({patient.patient_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Invoice Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-xs">Item</Label>
                    <Select value={item.name} onValueChange={(v) => updateItem(index, "name", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Consultation">Consultation</SelectItem>
                        <SelectItem value="Follow-up">Follow-up</SelectItem>
                        {products?.map((p) => (
                          <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs">Price (KES)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.price}
                      onChange={(e) => updateItem(index, "price", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">KES {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT (16%)</span>
                <span className="font-medium">KES {tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">KES {total.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

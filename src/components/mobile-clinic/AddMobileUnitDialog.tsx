import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddMobileUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnitAdded: () => void;
}

export function AddMobileUnitDialog({ open, onOpenChange, onUnitAdded }: AddMobileUnitDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    vehicle_registration: "",
    home_branch_id: "",
    assigned_doctor_id: "",
  });

  const { data: branches } = useQuery({
    queryKey: ["branches-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: doctors } = useQuery({
    queryKey: ["doctors-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name");
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.home_branch_id) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("mobile_units").insert({
        name: formData.name,
        vehicle_registration: formData.vehicle_registration || null,
        home_branch_id: formData.home_branch_id,
        assigned_doctor_id: formData.assigned_doctor_id || null,
      });

      if (error) throw error;

      toast({ title: "Mobile unit added successfully" });
      onUnitAdded();
      onOpenChange(false);
      setFormData({ name: "", vehicle_registration: "", home_branch_id: "", assigned_doctor_id: "" });
    } catch (error: any) {
      toast({ title: "Error adding unit", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Mobile Unit</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Unit Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Mobile Unit 1"
            />
          </div>

          <div className="space-y-2">
            <Label>Vehicle Registration</Label>
            <Input
              value={formData.vehicle_registration}
              onChange={(e) => setFormData({ ...formData, vehicle_registration: e.target.value })}
              placeholder="e.g., KAB 123X"
            />
          </div>

          <div className="space-y-2">
            <Label>Home Branch *</Label>
            <Select
              value={formData.home_branch_id}
              onValueChange={(value) => setFormData({ ...formData, home_branch_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select home branch" />
              </SelectTrigger>
              <SelectContent>
                {branches?.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Default Doctor</Label>
            <Select
              value={formData.assigned_doctor_id}
              onValueChange={(value) => setFormData({ ...formData, assigned_doctor_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select doctor (optional)" />
              </SelectTrigger>
              <SelectContent>
                {doctors?.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Unit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

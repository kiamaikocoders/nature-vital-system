import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

interface AddSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  onSessionAdded: () => void;
}

export function AddSessionDialog({
  open,
  onOpenChange,
  selectedDate,
  onSessionAdded,
}: AddSessionDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    mobile_unit_id: "",
    location_id: "",
    doctor_id: "",
    start_time: "08:00",
    end_time: "17:00",
    notes: "",
  });

  const { data: mobileUnits } = useQuery({
    queryKey: ["mobile-units-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mobile_units")
        .select("id, name")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: locations } = useQuery({
    queryKey: ["mobile-locations-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mobile_locations")
        .select("id, name, city")
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
    if (!selectedDate || !formData.mobile_unit_id || !formData.location_id) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("mobile_sessions").insert({
        mobile_unit_id: formData.mobile_unit_id,
        location_id: formData.location_id,
        doctor_id: formData.doctor_id || null,
        session_date: format(selectedDate, "yyyy-MM-dd"),
        start_time: formData.start_time,
        end_time: formData.end_time,
        notes: formData.notes || null,
      });

      if (error) throw error;

      toast({ title: "Session scheduled successfully" });
      onSessionAdded();
      onOpenChange(false);
      setFormData({
        mobile_unit_id: "",
        location_id: "",
        doctor_id: "",
        start_time: "08:00",
        end_time: "17:00",
        notes: "",
      });
    } catch (error: any) {
      toast({ title: "Error scheduling session", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Schedule Session - {selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Mobile Unit *</Label>
            <Select
              value={formData.mobile_unit_id}
              onValueChange={(value) => setFormData({ ...formData, mobile_unit_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mobile unit" />
              </SelectTrigger>
              <SelectContent>
                {mobileUnits?.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Location *</Label>
            <Select
              value={formData.location_id}
              onValueChange={(value) => setFormData({ ...formData, location_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations?.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name} ({loc.city})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assigned Doctor</Label>
            <Select
              value={formData.doctor_id}
              onValueChange={(value) => setFormData({ ...formData, doctor_id: value })}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Scheduling..." : "Schedule Session"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

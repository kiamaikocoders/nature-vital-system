import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface BookAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAppointmentBooked: () => void;
}

const appointmentTypes = [
  "Consultation",
  "Follow-up",
  "New Patient",
  "Emergency",
  "Wellness Check",
];

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00"
];

export function BookAppointmentDialog({ open, onOpenChange, onAppointmentBooked }: BookAppointmentDialogProps) {
  const { profile, isSuperAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: "",
    appointment_date: "",
    appointment_time: "",
    type: "Consultation",
    doctor_id: "",
    branch_id: "",
    notes: "",
  });

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

  const selectedBranchId = isSuperAdmin ? formData.branch_id : profile?.branch_id;

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

  const { data: doctors } = useQuery({
    queryKey: ["doctors", selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("branch_id", selectedBranchId);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBranchId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_id || !formData.appointment_date || !formData.appointment_time) {
      toast.error("Please fill in required fields");
      return;
    }

    const branchId = isSuperAdmin ? formData.branch_id : profile?.branch_id;
    if (!branchId) {
      toast.error("Branch assignment required");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("appointments").insert({
        patient_id: formData.patient_id,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        type: formData.type,
        doctor_id: formData.doctor_id || null,
        branch_id: branchId,
        notes: formData.notes || null,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Appointment booked successfully");
      setFormData({
        patient_id: "",
        appointment_date: "",
        appointment_time: "",
        type: "Consultation",
        doctor_id: "",
        branch_id: "",
        notes: "",
      });
      onAppointmentBooked();
      onOpenChange(false);
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error("Failed to book appointment");
    } finally {
      setIsLoading(false);
    }
  };

  // Get tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Book New Appointment</DialogTitle>
          <DialogDescription>
            Schedule a new appointment for a patient
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {isSuperAdmin && (
              <div className="grid gap-2">
                <Label htmlFor="branch">Branch *</Label>
                <Select
                  value={formData.branch_id}
                  onValueChange={(value) => setFormData({ ...formData, branch_id: value, patient_id: "", doctor_id: "" })}
                >
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
              <Label htmlFor="patient">Patient *</Label>
              <Select
                value={formData.patient_id}
                onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
                disabled={isSuperAdmin && !formData.branch_id}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  min={minDate}
                  value={formData.appointment_date}
                  onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">Time *</Label>
                <Select
                  value={formData.appointment_time}
                  onValueChange={(value) => setFormData({ ...formData, appointment_time: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Appointment Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="doctor">Assigned Doctor</Label>
                <Select
                  value={formData.doctor_id}
                  onValueChange={(value) => setFormData({ ...formData, doctor_id: value })}
                  disabled={isSuperAdmin && !formData.branch_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors?.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>{doctor.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Booking..." : "Book Appointment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

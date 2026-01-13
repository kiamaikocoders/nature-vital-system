import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, MapPin, Plus } from "lucide-react";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { AppointmentDetailsDialog } from "@/components/appointments/AppointmentDetailsDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Appointments() {
  const queryClient = useQueryClient();
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<{
    id: number;
    patient: string;
    patientId?: string;
    time: string;
    doctor: string;
    type: string;
    branch: string;
    status: string;
    notes?: string;
  } | null>(null);

  const { data: appointmentsData = [], refetch } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          patients(id, first_name, last_name),
          profiles(full_name),
          branches(name)
        `)
        .gte("appointment_date", today)
        .order("appointment_date")
        .order("appointment_time");
      if (error) throw error;
      return data;
    },
  });

  const appointments = appointmentsData.map((apt, index) => ({
    id: index + 1,
    realId: apt.id,
    patient: apt.patients ? `${apt.patients.first_name} ${apt.patients.last_name}` : "Unknown",
    patientId: apt.patients?.id,
    time: apt.appointment_time ? format(new Date(`2000-01-01T${apt.appointment_time}`), "hh:mm a") : "",
    doctor: apt.profiles?.full_name || "Unassigned",
    type: apt.type || "Consultation",
    branch: apt.branches?.name || "Unknown",
    status: apt.status === "pending" ? "Pending" 
          : apt.status === "confirmed" ? "Confirmed"
          : apt.status === "completed" ? "Completed"
          : apt.status === "cancelled" ? "Cancelled"
          : apt.status === "waiting" ? "Waiting"
          : apt.status || "Pending",
    notes: apt.notes,
  }));

  const todayAppointments = appointmentsData.filter(
    apt => apt.appointment_date === format(new Date(), "yyyy-MM-dd")
  );

  const pendingCount = appointments.filter(a => a.status === "Pending").length;
  const newPatientCount = appointments.filter(a => a.type === "New Patient").length;

  const handleStatusChange = async (id: number, status: string) => {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;

    const { error } = await supabase
      .from("appointments")
      .update({ status: status.toLowerCase() })
      .eq("id", apt.realId);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    toast.success(`Appointment marked as ${status}`);
    refetch();
    setDetailsDialogOpen(false);
  };

  const openDetails = (apt: typeof appointments[0]) => {
    setSelectedAppointment(apt);
    setDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground">Manage appointments across all branches</p>
        </div>
        <Button className="gap-2" onClick={() => setBookDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Book Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{todayAppointments.length}</p>
              <p className="text-sm text-muted-foreground">Today's Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent">
              <User className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{newPatientCount}</p>
              <p className="text-sm text-muted-foreground">New Patients</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">4</p>
              <p className="text-sm text-muted-foreground">Active Branches</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No upcoming appointments. Book one to get started!
            </div>
          ) : (
            appointments.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[60px]">
                    <p className="text-lg font-bold text-primary">{apt.time.split(' ')[0]}</p>
                    <p className="text-xs text-muted-foreground">{apt.time.split(' ')[1]}</p>
                  </div>
                  <div className="h-12 w-px bg-border" />
                  <div>
                    <p className="font-medium text-foreground">{apt.patient}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{apt.doctor}</span>
                      <span>•</span>
                      <span>{apt.type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{apt.branch}</Badge>
                  <Badge 
                    variant={apt.status === "Confirmed" ? "default" : apt.status === "Waiting" ? "secondary" : "outline"}
                  >
                    {apt.status}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => openDetails(apt)}>
                    Details
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <BookAppointmentDialog
        open={bookDialogOpen}
        onOpenChange={setBookDialogOpen}
        onAppointmentBooked={refetch}
      />

      <AppointmentDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        appointment={selectedAppointment}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

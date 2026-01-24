import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import {
  UserCheck,
  Clock,
  Stethoscope,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  checked_in: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  no_show: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

interface VitalsData {
  blood_pressure?: string;
  heart_rate?: string;
  temperature?: string;
  weight?: string;
  height?: string;
}

export function MobileCheckIn() {
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [showConsultDialog, setShowConsultDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [vitals, setVitals] = useState<VitalsData>({});
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();

  const { data: todaySessions } = useQuery({
    queryKey: ["today-sessions"],
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
          location:mobile_locations(name, city),
          mobile_unit:mobile_units(name),
          doctor:profiles!mobile_sessions_doctor_id_fkey(full_name)
        `)
        .eq("session_date", today)
        .in("status", ["scheduled", "in_progress"]);

      if (error) throw error;
      return data;
    },
  });

  const { data: appointments, refetch: refetchAppointments } = useQuery({
    queryKey: ["session-appointments", selectedSession],
    queryFn: async () => {
      if (!selectedSession) return [];
      const { data, error } = await supabase
        .from("mobile_appointments")
        .select(`
          id,
          appointment_time,
          status,
          check_in_time,
          vitals,
          chief_complaint,
          diagnosis,
          treatment,
          notes,
          patient:patients(id, first_name, last_name, patient_code, phone)
        `)
        .eq("session_id", selectedSession)
        .order("appointment_time");

      if (error) throw error;
      return data;
    },
    enabled: !!selectedSession,
  });

  // Real-time subscription for appointments
  useEffect(() => {
    if (!selectedSession) return;

    const channel = supabase
      .channel(`appointments-${selectedSession}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mobile_appointments",
          filter: `session_id=eq.${selectedSession}`,
        },
        () => {
          refetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedSession, refetchAppointments]);

  const checkInMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from("mobile_appointments")
        .update({
          status: "checked_in",
          check_in_time: new Date().toISOString(),
        })
        .eq("id", appointmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Patient checked in");
      refetchAppointments();
    },
    onError: (error: any) => {
      toast.error(error.message || "Check-in failed");
    },
  });

  const startConsultMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from("mobile_appointments")
        .update({ status: "in_progress" })
        .eq("id", appointmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Consultation started");
      refetchAppointments();
    },
  });

  const completeConsultMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAppointment) return;

      const { error } = await supabase
        .from("mobile_appointments")
        .update({
          status: "completed",
          vitals: vitals as Record<string, string>,
          chief_complaint: chiefComplaint,
          diagnosis: diagnosis,
          treatment: treatment,
          notes: notes,
        })
        .eq("id", selectedAppointment.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Consultation completed");
      setShowConsultDialog(false);
      resetConsultForm();
      refetchAppointments();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to complete consultation");
    },
  });

  const markNoShowMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from("mobile_appointments")
        .update({ status: "no_show" })
        .eq("id", appointmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marked as no-show");
      refetchAppointments();
    },
  });

  const openConsultDialog = (appointment: any) => {
    setSelectedAppointment(appointment);
    setVitals((appointment.vitals as VitalsData) || {});
    setChiefComplaint(appointment.chief_complaint || "");
    setDiagnosis(appointment.diagnosis || "");
    setTreatment(appointment.treatment || "");
    setNotes(appointment.notes || "");
    setShowConsultDialog(true);
  };

  const resetConsultForm = () => {
    setSelectedAppointment(null);
    setVitals({});
    setChiefComplaint("");
    setDiagnosis("");
    setTreatment("");
    setNotes("");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "checked_in":
        return <UserCheck className="h-4 w-4" />;
      case "in_progress":
        return <Stethoscope className="h-4 w-4" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "no_show":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Session Selector - Mobile Optimized */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a session to manage" />
            </SelectTrigger>
            <SelectContent>
              {todaySessions?.map((session: any) => (
                <SelectItem key={session.id} value={session.id}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {session.location?.city} - {session.start_time?.slice(0, 5)} to {session.end_time?.slice(0, 5)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {todaySessions?.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              No sessions scheduled for today.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Appointments List - Mobile Optimized Cards */}
      {selectedSession && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            Appointments ({appointments?.length || 0})
          </h3>

          {!appointments?.length ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No appointments for this session.
              </CardContent>
            </Card>
          ) : (
            appointments.map((apt: any) => (
              <Card key={apt.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-lg font-semibold">
                          {apt.appointment_time?.slice(0, 5)}
                        </span>
                        <Badge className={statusColors[apt.status]}>
                          {getStatusIcon(apt.status)}
                          <span className="ml-1">{apt.status?.replace("_", " ")}</span>
                        </Badge>
                      </div>
                      <div className="font-medium truncate">
                        {apt.patient?.first_name} {apt.patient?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {apt.patient?.patient_code} • {apt.patient?.phone || "No phone"}
                      </div>
                      {apt.check_in_time && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Checked in: {format(new Date(apt.check_in_time), "HH:mm")}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {apt.status === "scheduled" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => checkInMutation.mutate(apt.id)}
                          >
                            <UserCheck className="mr-1 h-4 w-4" />
                            Check In
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markNoShowMutation.mutate(apt.id)}
                          >
                            No Show
                          </Button>
                        </>
                      )}
                      {apt.status === "checked_in" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            startConsultMutation.mutate(apt.id);
                            openConsultDialog(apt);
                          }}
                        >
                          <Stethoscope className="mr-1 h-4 w-4" />
                          Start Consult
                        </Button>
                      )}
                      {apt.status === "in_progress" && (
                        <Button size="sm" onClick={() => openConsultDialog(apt)}>
                          Continue
                        </Button>
                      )}
                      {apt.status === "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openConsultDialog(apt)}
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Consultation Dialog */}
      <Dialog open={showConsultDialog} onOpenChange={setShowConsultDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAppointment?.patient?.first_name}{" "}
              {selectedAppointment?.patient?.last_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Vitals Section */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Vitals</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Blood Pressure</Label>
                  <Input
                    placeholder="120/80"
                    value={vitals.blood_pressure || ""}
                    onChange={(e) =>
                      setVitals({ ...vitals, blood_pressure: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Heart Rate (bpm)</Label>
                  <Input
                    placeholder="72"
                    value={vitals.heart_rate || ""}
                    onChange={(e) =>
                      setVitals({ ...vitals, heart_rate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Temperature (°C)</Label>
                  <Input
                    placeholder="36.5"
                    value={vitals.temperature || ""}
                    onChange={(e) =>
                      setVitals({ ...vitals, temperature: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Weight (kg)</Label>
                  <Input
                    placeholder="70"
                    value={vitals.weight || ""}
                    onChange={(e) =>
                      setVitals({ ...vitals, weight: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Clinical Notes */}
            <div className="space-y-2">
              <Label>Chief Complaint</Label>
              <Textarea
                placeholder="Patient's main concern..."
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Textarea
                placeholder="Clinical diagnosis..."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Treatment / Prescription</Label>
              <Textarea
                placeholder="Treatment plan and medications..."
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                placeholder="Any other notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowConsultDialog(false)}>
                Cancel
              </Button>
              {selectedAppointment?.status !== "completed" && (
                <Button onClick={() => completeConsultMutation.mutate()}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Complete Consultation
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

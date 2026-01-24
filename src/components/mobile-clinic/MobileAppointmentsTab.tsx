import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Calendar, User, MapPin } from "lucide-react";
import { format } from "date-fns";
import { BookMobileAppointmentDialog } from "./BookMobileAppointmentDialog";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  checked_in: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  no_show: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export function MobileAppointmentsTab() {
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string>("all");

  const { data: sessions } = useQuery({
    queryKey: ["mobile-sessions-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mobile_sessions")
        .select(`
          id,
          session_date,
          location:mobile_locations(name, city)
        `)
        .gte("session_date", format(new Date(), "yyyy-MM-dd"))
        .order("session_date");

      if (error) throw error;
      return data;
    },
  });

  const { data: appointments, refetch } = useQuery({
    queryKey: ["mobile-appointments", selectedSessionFilter],
    queryFn: async () => {
      let query = supabase
        .from("mobile_appointments")
        .select(`
          id,
          appointment_time,
          status,
          check_in_time,
          chief_complaint,
          notes,
          created_at,
          patient:patients(id, first_name, last_name, patient_code),
          session:mobile_sessions(
            id,
            session_date,
            location:mobile_locations(name, city),
            doctor:profiles!mobile_sessions_doctor_id_fkey(full_name)
          )
        `)
        .order("appointment_time");

      if (selectedSessionFilter !== "all") {
        query = query.eq("session_id", selectedSessionFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Mobile Appointments
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={selectedSessionFilter} onValueChange={setSelectedSessionFilter}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filter by session" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              {sessions?.map((session: any) => (
                <SelectItem key={session.id} value={session.id}>
                  {session.location?.city} - {format(new Date(session.session_date), "MMM d")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowBookDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Book Appointment
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!appointments?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            No appointments found. Book one to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Chief Complaint</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((apt: any) => (
                <TableRow key={apt.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {apt.patient?.first_name} {apt.patient?.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {apt.patient?.patient_code}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div>{apt.session?.location?.city}</div>
                        <div className="text-xs text-muted-foreground">
                          {apt.session?.session_date && format(new Date(apt.session.session_date), "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {apt.appointment_time?.slice(0, 5)}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[apt.status] || statusColors.scheduled}>
                      {apt.status?.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {apt.chief_complaint || "-"}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {apt.notes || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <BookMobileAppointmentDialog
        open={showBookDialog}
        onOpenChange={setShowBookDialog}
        onAppointmentBooked={refetch}
      />
    </Card>
  );
}

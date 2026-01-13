import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, MapPin, Stethoscope, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AppointmentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: number;
    patient: string;
    patientId?: string;
    time: string;
    doctor: string;
    type: string;
    branch: string;
    status: string;
    notes?: string;
  } | null;
  onStatusChange?: (id: number, status: string) => void;
}

export function AppointmentDetailsDialog({ 
  open, 
  onOpenChange, 
  appointment, 
  onStatusChange 
}: AppointmentDetailsDialogProps) {
  const navigate = useNavigate();

  if (!appointment) return null;

  const statusColors: Record<string, string> = {
    Confirmed: "bg-primary text-primary-foreground",
    Pending: "bg-accent text-accent-foreground",
    Waiting: "bg-secondary text-secondary-foreground",
    Completed: "bg-muted text-muted-foreground",
    Cancelled: "bg-destructive text-destructive-foreground",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Appointment Details
          </DialogTitle>
          <DialogDescription>
            View and manage appointment information
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Patient Info */}
          <div className="flex items-start gap-4 p-4 rounded-lg bg-accent/30">
            <div className="p-2 rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{appointment.patient}</p>
              <p className="text-sm text-muted-foreground">{appointment.type}</p>
            </div>
            <Badge className={statusColors[appointment.status]}>
              {appointment.status}
            </Badge>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="font-medium text-foreground">{appointment.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Branch</p>
                <p className="font-medium text-foreground">{appointment.branch}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border col-span-2">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Doctor</p>
                <p className="font-medium text-foreground">{appointment.doctor}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Notes</p>
              </div>
              <p className="text-sm text-muted-foreground">{appointment.notes}</p>
            </div>
          )}

          {/* Status Actions */}
          {onStatusChange && appointment.status !== "Completed" && appointment.status !== "Cancelled" && (
            <div className="flex flex-wrap gap-2">
              <p className="w-full text-sm text-muted-foreground mb-1">Update Status:</p>
              {["Confirmed", "Waiting", "Completed", "Cancelled"].filter(s => s !== appointment.status).map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  onClick={() => onStatusChange(appointment.id, status)}
                >
                  Mark as {status}
                </Button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {appointment.patientId && (
            <Button 
              variant="outline" 
              onClick={() => {
                navigate(`/patients/${appointment.patientId}`);
                onOpenChange(false);
              }}
            >
              View Patient Profile
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, MapPin, Plus } from "lucide-react";

const appointments = [
  { id: 1, patient: "John Mwangi", time: "09:00 AM", doctor: "Dr. Sarah Kamau", type: "Follow-up", branch: "Machakos", status: "Confirmed" },
  { id: 2, patient: "Mary Wanjiku", time: "10:30 AM", doctor: "Dr. James Otieno", type: "Consultation", branch: "Mlolongo", status: "Confirmed" },
  { id: 3, patient: "Peter Ochieng", time: "11:00 AM", doctor: "Dr. Sarah Kamau", type: "New Patient", branch: "Matuu", status: "Pending" },
  { id: 4, patient: "Grace Akinyi", time: "02:00 PM", doctor: "Dr. Faith Mwende", type: "Follow-up", branch: "Tala Town", status: "Confirmed" },
  { id: 5, patient: "David Kiprop", time: "03:30 PM", doctor: "Dr. James Otieno", type: "Consultation", branch: "Machakos", status: "Waiting" },
];

export default function Appointments() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground">Today's schedule across all branches</p>
        </div>
        <Button className="gap-2">
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
              <p className="text-2xl font-bold text-foreground">47</p>
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
              <p className="text-2xl font-bold text-foreground">12</p>
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
              <p className="text-2xl font-bold text-foreground">8</p>
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
          <CardTitle className="text-lg font-semibold">Today's Appointments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {appointments.map((apt) => (
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
                <Button variant="outline" size="sm">Details</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

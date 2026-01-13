import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, User, Calendar, FileText } from "lucide-react";

const patients = [
  { id: "P001", name: "John Mwangi", age: 45, phone: "+254 712 345 678", branch: "Machakos", lastVisit: "2024-01-10", status: "Active" },
  { id: "P002", name: "Mary Wanjiku", age: 32, phone: "+254 723 456 789", branch: "Mlolongo", lastVisit: "2024-01-09", status: "Active" },
  { id: "P003", name: "Peter Ochieng", age: 58, phone: "+254 734 567 890", branch: "Matuu", lastVisit: "2024-01-08", status: "Follow-up" },
  { id: "P004", name: "Grace Akinyi", age: 28, phone: "+254 745 678 901", branch: "Tala Town", lastVisit: "2024-01-07", status: "Active" },
  { id: "P005", name: "David Kiprop", age: 41, phone: "+254 756 789 012", branch: "Machakos", lastVisit: "2024-01-05", status: "Completed" },
];

export default function Patients() {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patient Records</h1>
          <p className="text-muted-foreground">Electronic Health Records (EHR) Management</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/patients/new")}>
          <Plus className="h-4 w-4" />
          Register Patient
        </Button>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <CardTitle className="text-lg font-semibold">All Patients</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search patients..." className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-mono text-sm">{patient.id}</TableCell>
                  <TableCell className="font-medium">{patient.name}</TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell className="text-muted-foreground">{patient.phone}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{patient.branch}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{patient.lastVisit}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={patient.status === "Active" ? "default" : patient.status === "Follow-up" ? "secondary" : "outline"}
                    >
                      {patient.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <User className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Calendar className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

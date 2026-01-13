import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, User, Calendar, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInYears } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Patients() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: patientsData = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select(`
          *,
          branches(name),
          patient_visits(visit_date)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const patients = patientsData.map(p => {
    const lastVisit = p.patient_visits?.length > 0 
      ? p.patient_visits.sort((a: { visit_date: string }, b: { visit_date: string }) => 
          new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
        )[0]?.visit_date
      : null;
    
    const visitCount = p.patient_visits?.length || 0;
    
    return {
      id: p.id,
      patientCode: p.patient_code || p.id.slice(0, 8),
      name: `${p.first_name} ${p.last_name}`,
      age: p.date_of_birth ? differenceInYears(new Date(), new Date(p.date_of_birth)) : null,
      phone: p.phone || "-",
      branch: p.branches?.name || "Unknown",
      lastVisit: lastVisit ? format(new Date(lastVisit), "yyyy-MM-dd") : "Never",
      visitCount,
      status: visitCount > 0 ? (visitCount > 3 ? "Active" : "Follow-up") : "New",
    };
  });

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery)
  );

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
            <CardTitle className="text-lg font-semibold">All Patients ({patients.length})</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, ID, or phone..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
                <TableHead>Visits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No patients found" : "No patients registered yet. Add your first patient!"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-mono text-sm">{patient.patientCode}</TableCell>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>{patient.age !== null ? patient.age : "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{patient.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{patient.branch}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{patient.lastVisit}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{patient.visitCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={patient.status === "Active" ? "default" : patient.status === "Follow-up" ? "secondary" : "outline"}
                      >
                        {patient.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => navigate(`/patients/${patient.id}`)}
                              >
                                <User className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Profile</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => navigate(`/appointments`)}
                              >
                                <Calendar className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Book Appointment</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => navigate(`/patients/${patient.id}`)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Records</TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { ClinicalAssistant } from "@/components/ai/ClinicalAssistant";
import { NewVisitForm } from "@/components/patients/NewVisitForm";
import { 
  ArrowLeft, User, Phone, Mail, MapPin, Heart, 
  AlertTriangle, Calendar, Activity, Pill, FileText,
  Clock, Stethoscope, Plus
} from "lucide-react";

interface Patient {
  id: string;
  patient_code: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  blood_type: string | null;
  allergies: string[] | null;
  medical_history: any;
  diet_tracker: any;
  branch_id: string;
  created_at: string;
}

interface Visit {
  id: string;
  visit_date: string;
  chief_complaint: string | null;
  vitals: any;
  diagnosis: string | null;
  treatment: string | null;
  prescriptions: any;
  supplements_recommended: any;
  notes: string | null;
}

export default function PatientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewVisit, setShowNewVisit] = useState(false);

  const fetchPatientData = useCallback(async () => {
    if (!id) return;
    
    const [patientResult, visitsResult] = await Promise.all([
      supabase.from("patients").select("*").eq("id", id).maybeSingle(),
      supabase.from("patient_visits").select("*").eq("patient_id", id).order("visit_date", { ascending: false })
    ]);

    if (patientResult.data) {
      setPatient(patientResult.data as Patient);
    }
    if (visitsResult.data) {
      setVisits(visitsResult.data as Visit[]);
    }
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchPatientData();
  }, [fetchPatientData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading patient data...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Patient not found</p>
        <Button onClick={() => navigate("/patients")}>Back to Patients</Button>
      </div>
    );
  }

  const calculateAge = (dob: string | null) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const dietTracker = patient.diet_tracker || { alkaline: 80, acidic: 20 };
  const medicalHistoryStr = Array.isArray(patient.medical_history) 
    ? patient.medical_history.join(", ") 
    : "";

  return (
    <div className="space-y-6">
      {/* New Visit Modal */}
      {showNewVisit && (
        <NewVisitForm
          patientId={patient.id}
          patientName={`${patient.first_name} ${patient.last_name}`}
          branchId={patient.branch_id}
          onClose={() => setShowNewVisit(false)}
          onSuccess={() => {
            setShowNewVisit(false);
            fetchPatientData();
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/patients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {patient.first_name} {patient.last_name}
            </h1>
            <Badge variant="outline" className="font-mono">{patient.patient_code}</Badge>
            <Badge variant="secondary">{visits.length} visits</Badge>
          </div>
          <p className="text-muted-foreground">Patient Profile</p>
        </div>
        <Button variant="outline">Edit Profile</Button>
        <Button onClick={() => setShowNewVisit(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Visit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Patient Info */}
        <div className="space-y-6">
          {/* Basic Info Card */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Age</p>
                  <p className="font-medium">{calculateAge(patient.date_of_birth)} years</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gender</p>
                  <p className="font-medium capitalize">{patient.gender || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Blood Type</p>
                  <p className="font-medium">{patient.blood_type || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">DOB</p>
                  <p className="font-medium">{patient.date_of_birth || "N/A"}</p>
                </div>
              </div>
              
              <div className="pt-3 border-t border-border space-y-2">
                {patient.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.phone}</span>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.email}</span>
                  </div>
                )}
                {patient.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          {(patient.emergency_contact_name || patient.emergency_contact_phone) && (
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-destructive" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-medium">{patient.emergency_contact_name}</p>
                <p className="text-muted-foreground">{patient.emergency_contact_phone}</p>
              </CardContent>
            </Card>
          )}

          {/* Allergies */}
          {patient.allergies && patient.allergies.length > 0 && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Allergies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {patient.allergies.map((allergy, idx) => (
                    <Badge key={idx} variant="destructive">{allergy}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Diet Tracker */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                80/20 Alkaline-Acidic Diet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-primary font-medium">Alkaline</span>
                  <span>{dietTracker.alkaline}%</span>
                </div>
                <Progress value={dietTracker.alkaline} className="h-3" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Acidic</span>
                  <span>{dietTracker.acidic}%</span>
                </div>
                <Progress value={dietTracker.acidic} className="h-3 [&>div]:bg-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Target: 80% alkaline-forming foods, 20% acidic-forming foods
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Timeline & AI */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="timeline">Visit Timeline ({visits.length})</TabsTrigger>
              <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
              <TabsTrigger value="history">Medical History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="timeline" className="mt-4">
              <Card className="border-border bg-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Visit History
                    </CardTitle>
                    <Button size="sm" onClick={() => setShowNewVisit(true)} className="gap-1">
                      <Plus className="h-4 w-4" />
                      Add Visit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {visits.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No visits recorded yet</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => setShowNewVisit(true)}
                      >
                        Record First Visit
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                      <div className="space-y-6">
                        {visits.map((visit, idx) => (
                          <div key={visit.id} className="relative pl-10">
                            <div className="absolute left-2.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                            <Card className="border-border">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className="font-medium text-foreground">
                                      {new Date(visit.visit_date).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric"
                                      })}
                                    </p>
                                    {visit.chief_complaint && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        <span className="font-medium">Chief Complaint:</span> {visit.chief_complaint}
                                      </p>
                                    )}
                                  </div>
                                  <Badge variant="outline">Visit #{visits.length - idx}</Badge>
                                </div>
                                
                                {visit.vitals && (
                                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 my-3 p-3 bg-accent/30 rounded-lg text-xs">
                                    <div>
                                      <p className="text-muted-foreground">BP</p>
                                      <p className="font-medium">{visit.vitals.bp || "—"}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Temp</p>
                                      <p className="font-medium">{visit.vitals.temp || "—"}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Pulse</p>
                                      <p className="font-medium">{visit.vitals.pulse || "—"}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Weight</p>
                                      <p className="font-medium">{visit.vitals.weight || "—"}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Height</p>
                                      <p className="font-medium">{visit.vitals.height || "—"}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">O₂ Sat</p>
                                      <p className="font-medium">{visit.vitals.oxygen_sat || "—"}</p>
                                    </div>
                                  </div>
                                )}

                                {visit.diagnosis && (
                                  <div className="flex items-start gap-2 text-sm mb-2">
                                    <Stethoscope className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="font-medium">Diagnosis</p>
                                      <p className="text-muted-foreground">{visit.diagnosis}</p>
                                    </div>
                                  </div>
                                )}

                                {visit.treatment && (
                                  <div className="flex items-start gap-2 text-sm mb-2">
                                    <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="font-medium">Treatment</p>
                                      <p className="text-muted-foreground">{visit.treatment}</p>
                                    </div>
                                  </div>
                                )}

                                {visit.supplements_recommended && Array.isArray(visit.supplements_recommended) && visit.supplements_recommended.length > 0 && (
                                  <div className="flex items-start gap-2 text-sm">
                                    <Pill className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="font-medium">Supplements Recommended</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {visit.supplements_recommended.map((sup: string, i: number) => (
                                          <Badge key={i} variant="secondary" className="text-xs">{sup}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {visit.notes && (
                                  <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
                                    <p className="font-medium text-foreground">Notes:</p>
                                    <p>{visit.notes}</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="assistant" className="mt-4">
              <ClinicalAssistant 
                patientHistory={medicalHistoryStr}
                onSuggestionSelect={(supplement) => {
                  console.log("Selected supplement:", supplement);
                }}
              />
            </TabsContent>
            
            <TabsContent value="history" className="mt-4">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Medical History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(patient.medical_history) && patient.medical_history.length > 0 ? (
                    <ul className="space-y-2">
                      {patient.medical_history.map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-accent/30">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      No medical history recorded
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

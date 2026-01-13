import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Save, Activity, Stethoscope, Pill, X, Plus } from "lucide-react";
import { ClinicalAssistant } from "@/components/ai/ClinicalAssistant";

interface NewVisitFormProps {
  patientId: string;
  patientName: string;
  branchId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewVisitForm({ patientId, patientName, branchId, onClose, onSuccess }: NewVisitFormProps) {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);
  
  const [formData, setFormData] = useState({
    chief_complaint: "",
    bp: "",
    temp: "",
    pulse: "",
    weight: "",
    height: "",
    oxygen_sat: "",
    diagnosis: "",
    treatment: "",
    notes: "",
  });
  
  const [supplements, setSupplements] = useState<string[]>([]);
  const [newSupplement, setNewSupplement] = useState("");

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSupplement = (name: string) => {
    if (name && !supplements.includes(name)) {
      setSupplements(prev => [...prev, name]);
      setNewSupplement("");
    }
  };

  const removeSupplement = (name: string) => {
    setSupplements(prev => prev.filter(s => s !== name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const vitals = {
        bp: formData.bp || null,
        temp: formData.temp || null,
        pulse: formData.pulse || null,
        weight: formData.weight || null,
        height: formData.height || null,
        oxygen_sat: formData.oxygen_sat || null,
      };

      const { error } = await supabase.from("patient_visits").insert({
        patient_id: patientId,
        branch_id: branchId,
        doctor_id: profile?.id || null,
        visit_date: new Date().toISOString(),
        chief_complaint: formData.chief_complaint || null,
        vitals,
        diagnosis: formData.diagnosis || null,
        treatment: formData.treatment || null,
        supplements_recommended: supplements.length > 0 ? supplements : null,
        notes: formData.notes || null,
      });

      if (error) throw error;

      toast.success("Visit recorded successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("Error recording visit:", error);
      toast.error(error.message || "Failed to record visit");
    } finally {
      setIsLoading(false);
    }
  };

  const quickSupplements = ["PureFlow Detox", "VitalCal Plus", "NeuroVital", "Super Detox", "ImmunoBoost", "CardioHealth"];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8">
      <Card className="w-full max-w-4xl mx-4 border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              New Visit Record
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Patient: {patientName}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Chief Complaint */}
            <div className="space-y-2">
              <Label htmlFor="chief_complaint">Chief Complaint *</Label>
              <Textarea
                id="chief_complaint"
                placeholder="What brings the patient in today?"
                value={formData.chief_complaint}
                onChange={(e) => handleChange("chief_complaint", e.target.value)}
                required
                className="min-h-[80px]"
              />
            </div>

            {/* Vitals */}
            <Card className="border-border">
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Vitals
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="bp" className="text-xs">Blood Pressure</Label>
                  <Input
                    id="bp"
                    placeholder="120/80 mmHg"
                    value={formData.bp}
                    onChange={(e) => handleChange("bp", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="temp" className="text-xs">Temperature</Label>
                  <Input
                    id="temp"
                    placeholder="36.5°C"
                    value={formData.temp}
                    onChange={(e) => handleChange("temp", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pulse" className="text-xs">Pulse Rate</Label>
                  <Input
                    id="pulse"
                    placeholder="72 bpm"
                    value={formData.pulse}
                    onChange={(e) => handleChange("pulse", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="weight" className="text-xs">Weight</Label>
                  <Input
                    id="weight"
                    placeholder="70 kg"
                    value={formData.weight}
                    onChange={(e) => handleChange("weight", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="height" className="text-xs">Height</Label>
                  <Input
                    id="height"
                    placeholder="175 cm"
                    value={formData.height}
                    onChange={(e) => handleChange("height", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="oxygen_sat" className="text-xs">O₂ Saturation</Label>
                  <Input
                    id="oxygen_sat"
                    placeholder="98%"
                    value={formData.oxygen_sat}
                    onChange={(e) => handleChange("oxygen_sat", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Diagnosis & Treatment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Textarea
                  id="diagnosis"
                  placeholder="Clinical diagnosis..."
                  value={formData.diagnosis}
                  onChange={(e) => handleChange("diagnosis", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="treatment">Treatment Plan</Label>
                <Textarea
                  id="treatment"
                  placeholder="Treatment recommendations..."
                  value={formData.treatment}
                  onChange={(e) => handleChange("treatment", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>

            {/* Supplements */}
            <Card className="border-border">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Pill className="h-4 w-4 text-primary" />
                    Supplement Recommendations
                  </CardTitle>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAI(!showAI)}
                  >
                    {showAI ? "Hide AI" : "Get AI Suggestions"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selected Supplements */}
                {supplements.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {supplements.map((sup) => (
                      <Badge key={sup} variant="secondary" className="gap-1 pr-1">
                        {sup}
                        <button
                          type="button"
                          onClick={() => removeSupplement(sup)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Quick Add */}
                <div className="flex flex-wrap gap-2">
                  {quickSupplements.filter(s => !supplements.includes(s)).map((sup) => (
                    <Button
                      key={sup}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addSupplement(sup)}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {sup}
                    </Button>
                  ))}
                </div>

                {/* Custom Supplement */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom supplement..."
                    value={newSupplement}
                    onChange={(e) => setNewSupplement(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSupplement(newSupplement);
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={() => addSupplement(newSupplement)}>
                    Add
                  </Button>
                </div>

                {/* AI Assistant */}
                {showAI && (
                  <div className="mt-4">
                    <ClinicalAssistant
                      patientHistory=""
                      onSuggestionSelect={addSupplement}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional observations or notes..."
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="gap-2">
                <Save className="h-4 w-4" />
                {isLoading ? "Saving..." : "Save Visit Record"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

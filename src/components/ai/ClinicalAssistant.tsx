import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Pill, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClinicalAssistantProps {
  patientHistory?: string;
  onSuggestionSelect?: (supplement: string) => void;
}

export function ClinicalAssistant({ patientHistory, onSuggestionSelect }: ClinicalAssistantProps) {
  const [symptoms, setSymptoms] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getSuggestions = async () => {
    if (!symptoms.trim()) {
      toast.error("Please enter patient symptoms");
      return;
    }

    setIsLoading(true);
    setSuggestion("");

    try {
      const { data, error } = await supabase.functions.invoke("clinical-assistant", {
        body: { symptoms, patientHistory }
      });

      if (error) throw error;
      
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setSuggestion(data.suggestion);
    } catch (error) {
      console.error("Error getting suggestions:", error);
      toast.error("Failed to get AI suggestions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const supplements = ["PureFlow Detox", "VitalCal Plus", "NeuroVital", "Super Detox", "ImmunoBoost", "CardioHealth"];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Clinical Assistant
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter symptoms to get Nature-Vital supplement recommendations
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Enter patient symptoms (e.g., fatigue, digestive issues, joint pain, memory problems...)"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="min-h-[100px] resize-none"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">Quick add:</span>
          {["fatigue", "digestive issues", "joint pain", "brain fog", "weak immunity"].map((s) => (
            <Badge
              key={s}
              variant="outline"
              className="cursor-pointer hover:bg-accent"
              onClick={() => setSymptoms((prev) => prev ? `${prev}, ${s}` : s)}
            >
              + {s}
            </Badge>
          ))}
        </div>

        <Button onClick={getSuggestions} disabled={isLoading} className="w-full gap-2">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing symptoms...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Get AI Recommendations
            </>
          )}
        </Button>

        {suggestion && (
          <div className="mt-4 p-4 rounded-lg bg-accent/30 border border-border">
            <div className="flex items-start gap-2 mb-3">
              <Pill className="h-5 w-5 text-primary mt-0.5" />
              <h4 className="font-medium text-foreground">AI Recommendations</h4>
            </div>
            <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {suggestion}
            </div>
            
            {onSuggestionSelect && (
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Add to prescription:</p>
                <div className="flex flex-wrap gap-2">
                  {supplements.map((sup) => (
                    <Button
                      key={sup}
                      variant="outline"
                      size="sm"
                      onClick={() => onSuggestionSelect(sup)}
                      className="text-xs"
                    >
                      + {sup}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/20 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            AI suggestions are for reference only. Always use clinical judgment 
            and consult with the patient before prescribing any supplements.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

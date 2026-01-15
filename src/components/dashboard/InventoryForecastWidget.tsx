import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingDown, AlertTriangle, Clock, Loader2, Brain, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Prediction {
  name: string;
  branch: string;
  currentStock: number;
  avgDailySales: number;
  daysUntilStockout: number;
  urgency: "critical" | "warning" | "good";
  reorderQty: number;
  stockoutDate: string;
}

// Clean markdown from AI responses and format nicely
function FormattedAnalysis({ text }: { text: string }) {
  // Remove markdown formatting
  const cleanText = text
    .replace(/#{1,6}\s*/g, '') // Remove # headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold **text**
    .replace(/\*(.*?)\*/g, '$1') // Remove italic *text*
    .replace(/\|[^\n]+\|/g, '') // Remove table rows
    .replace(/\|?:?-+:?\|?/g, '') // Remove table separators
    .replace(/^\s*[-*]\s+/gm, '• ') // Convert - or * list items to bullet
    .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
    .trim();

  // Split into paragraphs
  const paragraphs = cleanText.split(/\n\n+/);

  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, idx) => {
        const lines = paragraph.split('\n').filter(line => line.trim());
        
        return (
          <div key={idx} className="space-y-1">
            {lines.map((line, lineIdx) => {
              const trimmedLine = line.trim();
              
              // Check if it's a numbered item
              const numberedMatch = trimmedLine.match(/^(\d+)\.\s*(.+)/);
              if (numberedMatch) {
                return (
                  <div key={lineIdx} className="flex gap-2">
                    <span className="text-primary font-medium min-w-[20px]">{numberedMatch[1]}.</span>
                    <span>{numberedMatch[2]}</span>
                  </div>
                );
              }
              
              // Check if it's a bullet item
              if (trimmedLine.startsWith('•')) {
                return (
                  <div key={lineIdx} className="flex gap-2 pl-4">
                    <span className="text-muted-foreground">•</span>
                    <span>{trimmedLine.substring(1).trim()}</span>
                  </div>
                );
              }
              
              // Regular text
              return <p key={lineIdx}>{trimmedLine}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

// Mock data for demonstration - in production this would come from the database
const mockProducts = [
  { name: "PureFlow Detox", currentStock: 12, avgDailySales: 2.5, minStockLevel: 20, branch: "Machakos" },
  { name: "VitalCal Plus", currentStock: 25, avgDailySales: 1.8, minStockLevel: 30, branch: "Mlolongo" },
  { name: "NeuroVital", currentStock: 45, avgDailySales: 1.2, minStockLevel: 25, branch: "Matuu" },
  { name: "Super Detox", currentStock: 8, avgDailySales: 3.0, minStockLevel: 30, branch: "Tala Town" },
  { name: "ImmunoBoost", currentStock: 60, avgDailySales: 2.0, minStockLevel: 40, branch: "Machakos" },
  { name: "CardioHealth", currentStock: 35, avgDailySales: 0.8, minStockLevel: 20, branch: "Mlolongo" },
];

export function InventoryForecastWidget() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const runForecast = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("inventory-forecast", {
        body: { products: mockProducts }
      });

      if (error) throw error;
      
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setPredictions(data.predictions || []);
      setAnalysis(data.analysis || "");
      setHasLoaded(true);
    } catch (error) {
      console.error("Forecast error:", error);
      toast.error("Failed to generate forecast");
    } finally {
      setIsLoading(false);
    }
  };

  const urgencyColors = {
    critical: "bg-destructive text-destructive-foreground",
    warning: "bg-accent text-accent-foreground",
    good: "bg-primary/10 text-primary",
  };

  const criticalCount = predictions.filter(p => p.urgency === "critical").length;
  const warningCount = predictions.filter(p => p.urgency === "warning").length;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Inventory Forecast
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runForecast} 
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {hasLoaded ? "Refresh" : "Run Forecast"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Predict stockouts across all branches based on sales velocity
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasLoaded && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingDown className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Click "Run Forecast" to analyze inventory</p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground mt-2">Analyzing sales velocity...</p>
          </div>
        )}

        {hasLoaded && !isLoading && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-destructive/10 text-center">
                <p className="text-2xl font-bold text-destructive">{criticalCount}</p>
                <p className="text-xs text-muted-foreground">Critical (&lt;7 days)</p>
              </div>
              <div className="p-3 rounded-lg bg-accent text-center">
                <p className="text-2xl font-bold text-accent-foreground">{warningCount}</p>
                <p className="text-xs text-muted-foreground">Warning (7-14 days)</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 text-center">
                <p className="text-2xl font-bold text-primary">{predictions.length - criticalCount - warningCount}</p>
                <p className="text-xs text-muted-foreground">Good (&gt;14 days)</p>
              </div>
            </div>

            {/* Predictions List */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {predictions
                .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout)
                .map((pred, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border hover:bg-accent/20 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-foreground">{pred.name}</p>
                        <p className="text-xs text-muted-foreground">{pred.branch}</p>
                      </div>
                      <Badge className={urgencyColors[pred.urgency]}>
                        {pred.urgency === "critical" && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {pred.daysUntilStockout} days
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Stock: {pred.currentStock} units</span>
                        <span className="text-muted-foreground">Avg: {pred.avgDailySales.toFixed(1)}/day</span>
                      </div>
                      <Progress 
                        value={Math.min(100, (pred.daysUntilStockout / 30) * 100)} 
                        className={`h-1.5 ${pred.urgency === "critical" ? "[&>div]:bg-destructive" : pred.urgency === "warning" ? "[&>div]:bg-accent-foreground" : ""}`}
                      />
                      <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Stockout: {pred.stockoutDate}
                        </span>
                        <span className="text-primary font-medium">Reorder: {pred.reorderQty} units</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* AI Analysis */}
            {analysis && (
              <div className="p-4 rounded-lg bg-accent/30 border border-border">
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  AI Analysis
                </h4>
                <div className="text-sm text-foreground leading-relaxed max-h-[200px] overflow-y-auto">
                  <FormattedAnalysis text={analysis} />
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

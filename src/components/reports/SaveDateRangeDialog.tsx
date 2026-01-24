import { useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SaveDateRangeDialogProps {
  dateRange: DateRange | undefined;
  onSave: (name: string) => void;
}

export function SaveDateRangeDialog({ dateRange, onSave }: SaveDateRangeDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const handleSave = () => {
    if (name.trim() && dateRange?.from && dateRange?.to) {
      onSave(name.trim());
      setName("");
      setOpen(false);
    }
  };

  const isValid = dateRange?.from && dateRange?.to;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!isValid} title="Save current date range">
          <Save className="h-4 w-4 mr-2" />
          Save Range
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Date Range</DialogTitle>
          <DialogDescription>
            Give this date range a name for quick access later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="range-name">Name</Label>
            <Input
              id="range-name"
              placeholder="e.g., Q1 2024, Last Summer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          {dateRange?.from && dateRange?.to && (
            <div className="text-sm text-muted-foreground">
              Range: {format(dateRange.from, "MMM d, yyyy")} – {format(dateRange.to, "MMM d, yyyy")}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

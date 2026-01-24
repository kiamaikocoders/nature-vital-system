import { format } from "date-fns";
import { X, Bookmark } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SavedDateRange } from "@/hooks/useSavedDateRanges";

interface SavedDateRangesProps {
  savedRanges: SavedDateRange[];
  onSelect: (range: DateRange) => void;
  onDelete: (id: string) => void;
  getDateRange: (saved: SavedDateRange) => DateRange;
}

export function SavedDateRanges({
  savedRanges,
  onSelect,
  onDelete,
  getDateRange,
}: SavedDateRangesProps) {
  if (savedRanges.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground flex items-center gap-1">
        <Bookmark className="h-3 w-3" />
        Saved:
      </span>
      {savedRanges.map((saved) => {
        const range = getDateRange(saved);
        return (
          <Tooltip key={saved.id}>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80 pr-1 gap-1"
              >
                <span onClick={() => onSelect(range)}>{saved.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-destructive/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(saved.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {format(range.from!, "MMM d, yyyy")} – {format(range.to!, "MMM d, yyyy")}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

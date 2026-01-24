import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { AddSessionDialog } from "./AddSessionDialog";

interface MobileSession {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  mobile_unit: { id: string; name: string } | null;
  location: { id: string; name: string; city: string } | null;
  doctor: { id: string; full_name: string } | null;
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  in_progress: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function RouteCalendar() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: sessions, refetch } = useQuery({
    queryKey: ["mobile-sessions", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const weekEnd = addDays(weekStart, 6);
      const { data, error } = await supabase
        .from("mobile_sessions")
        .select(`
          id,
          session_date,
          start_time,
          end_time,
          status,
          notes,
          mobile_unit:mobile_units(id, name),
          location:mobile_locations(id, name, city),
          doctor:profiles!mobile_sessions_doctor_id_fkey(id, full_name)
        `)
        .gte("session_date", format(weekStart, "yyyy-MM-dd"))
        .lte("session_date", format(weekEnd, "yyyy-MM-dd"))
        .order("session_date")
        .order("start_time");

      if (error) throw error;
      return data as unknown as MobileSession[];
    },
  });

  const getSessionsForDay = (date: Date) => {
    return sessions?.filter(
      (session) => session.session_date === format(date, "yyyy-MM-dd")
    ) || [];
  };

  const handleAddSession = (date: Date) => {
    setSelectedDate(date);
    setShowAddDialog(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Weekly Route Schedule</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[200px] text-center font-medium">
            {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </span>
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className="min-h-[200px] rounded-lg border bg-card p-2"
            >
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">
                    {format(day, "EEE")}
                  </div>
                  <div className="font-semibold">{format(day, "d")}</div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleAddSession(day)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1">
                {getSessionsForDay(day).map((session) => (
                  <div
                    key={session.id}
                    className={`rounded p-1.5 text-xs ${statusColors[session.status] || statusColors.scheduled}`}
                  >
                    <div className="font-medium truncate">
                      {session.location?.city || "Unknown"}
                    </div>
                    <div className="truncate text-[10px] opacity-80">
                      {session.doctor?.full_name || "No doctor"}
                    </div>
                    <div className="text-[10px] opacity-70">
                      {session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <AddSessionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        selectedDate={selectedDate}
        onSessionAdded={refetch}
      />
    </Card>
  );
}

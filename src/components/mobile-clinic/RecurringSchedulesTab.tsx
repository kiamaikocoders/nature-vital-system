import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, RefreshCw, Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, startOfWeek, nextMonday } from "date-fns";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const TIME_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
];

export function RecurringSchedulesTab() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    mobile_unit_id: "",
    location_id: "",
    doctor_id: "",
    day_of_week: "",
    start_time: "08:00",
    end_time: "17:00",
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const queryClient = useQueryClient();

  const { data: templates, refetch } = useQuery({
    queryKey: ["schedule-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mobile_schedule_templates")
        .select(`
          id,
          day_of_week,
          start_time,
          end_time,
          is_active,
          mobile_unit:mobile_units(id, name),
          location:mobile_locations(id, name, city),
          doctor:profiles(id, full_name)
        `)
        .eq("is_active", true)
        .order("day_of_week");

      if (error) throw error;
      return data;
    },
  });

  const { data: units } = useQuery({
    queryKey: ["mobile-units"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mobile_units")
        .select("id, name")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: locations } = useQuery({
    queryKey: ["mobile-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mobile_locations")
        .select("id, name, city")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("mobile_schedule_templates").insert({
        mobile_unit_id: formData.mobile_unit_id,
        location_id: formData.location_id,
        doctor_id: formData.doctor_id || null,
        day_of_week: parseInt(formData.day_of_week),
        start_time: formData.start_time,
        end_time: formData.end_time,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Schedule template created");
      setShowAddDialog(false);
      refetch();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create template");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("mobile_schedule_templates")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Template removed");
      refetch();
    },
  });

  const generateSessions = async () => {
    if (!templates?.length) {
      toast.error("No schedule templates to generate from");
      return;
    }

    setIsGenerating(true);
    try {
      const nextWeekStart = nextMonday(new Date());
      const sessionsToCreate = [];

      for (const template of templates) {
        // Calculate the date for this day of week in next week
        const dayOffset = template.day_of_week === 0 ? 6 : template.day_of_week - 1;
        const sessionDate = addDays(nextWeekStart, dayOffset);

        sessionsToCreate.push({
          mobile_unit_id: (template.mobile_unit as any)?.id,
          location_id: (template.location as any)?.id,
          doctor_id: (template.doctor as any)?.id || null,
          session_date: format(sessionDate, "yyyy-MM-dd"),
          start_time: template.start_time,
          end_time: template.end_time,
          status: "scheduled",
        });
      }

      const { error } = await supabase.from("mobile_sessions").insert(sessionsToCreate);
      if (error) throw error;

      toast.success(`Generated ${sessionsToCreate.length} sessions for next week`);
      queryClient.invalidateQueries({ queryKey: ["mobile-sessions"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to generate sessions");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      mobile_unit_id: "",
      location_id: "",
      doctor_id: "",
      day_of_week: "",
      start_time: "08:00",
      end_time: "17:00",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Weekly Schedule Templates
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={generateSessions}
              disabled={isGenerating || !templates?.length}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate Next Week"}
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!templates?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No schedule templates. Add templates to automate weekly session creation.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Mobile Unit</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template: any) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {DAYS_OF_WEEK[template.day_of_week]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{template.mobile_unit?.name}</TableCell>
                    <TableCell>
                      {template.location?.name} ({template.location?.city})
                    </TableCell>
                    <TableCell>{template.doctor?.full_name || "-"}</TableCell>
                    <TableCell className="font-mono">
                      {template.start_time?.slice(0, 5)} - {template.end_time?.slice(0, 5)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(template.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Schedule Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Day of Week *</Label>
              <Select
                value={formData.day_of_week}
                onValueChange={(v) => setFormData({ ...formData, day_of_week: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mobile Unit *</Label>
              <Select
                value={formData.mobile_unit_id}
                onValueChange={(v) => setFormData({ ...formData, mobile_unit_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units?.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Location *</Label>
              <Select
                value={formData.location_id}
                onValueChange={(v) => setFormData({ ...formData, location_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name} ({loc.city})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select
                value={formData.doctor_id}
                onValueChange={(v) => setFormData({ ...formData, doctor_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {doctors?.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Select
                  value={formData.start_time}
                  onValueChange={(v) => setFormData({ ...formData, start_time: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Select
                  value={formData.end_time}
                  onValueChange={(v) => setFormData({ ...formData, end_time: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!formData.mobile_unit_id || !formData.location_id || !formData.day_of_week}
              >
                Add Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

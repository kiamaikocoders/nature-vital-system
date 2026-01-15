import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationStore } from "@/hooks/useNotificationStore";

interface NotificationPayload {
  eventType: string;
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
}

export function useRealtimeNotifications() {
  const { toast } = useToast();
  const { profile, isSuperAdmin } = useAuth();
  const { addNotification, notifications, markAsRead, markAllAsRead, clearNotification, clearAllNotifications } = useNotificationStore();

  const handleAppointmentChange = useCallback(
    (payload: NotificationPayload) => {
      if (payload.eventType === "INSERT") {
        const newAppointment = payload.new as {
          appointment_date?: string;
          appointment_time?: string;
          type?: string;
        };
        const description = `${newAppointment?.type || "Consultation"} scheduled for ${newAppointment?.appointment_date} at ${newAppointment?.appointment_time}`;
        
        addNotification({
          type: "appointment",
          title: "📅 New Appointment Booked",
          description,
        });
        
        toast({
          title: "📅 New Appointment Booked",
          description,
        });
      } else if (payload.eventType === "UPDATE") {
        const updated = payload.new as { status?: string };
        if (updated?.status === "completed") {
          addNotification({
            type: "appointment",
            title: "✅ Appointment Completed",
            description: "An appointment has been marked as completed",
          });
          toast({
            title: "✅ Appointment Completed",
            description: "An appointment has been marked as completed",
          });
        } else if (updated?.status === "cancelled") {
          addNotification({
            type: "appointment",
            title: "❌ Appointment Cancelled",
            description: "An appointment has been cancelled",
            variant: "destructive",
          });
          toast({
            title: "❌ Appointment Cancelled",
            description: "An appointment has been cancelled",
            variant: "destructive",
          });
        }
      }
    },
    [toast, addNotification]
  );

  const handleInventoryChange = useCallback(
    (payload: NotificationPayload) => {
      const product = payload.new as {
        name?: string;
        stock_quantity?: number;
        min_stock_level?: number;
      };

      if (!product) return;

      const stockQty = product.stock_quantity ?? 0;
      const minLevel = product.min_stock_level ?? 10;

      if (stockQty <= minLevel * 0.3) {
        // Critical stock (30% of min)
        addNotification({
          type: "inventory",
          title: "🚨 Critical Stock Alert",
          description: `${product.name} is critically low (${stockQty} remaining)`,
          variant: "destructive",
        });
        toast({
          title: "🚨 Critical Stock Alert",
          description: `${product.name} is critically low (${stockQty} remaining)`,
          variant: "destructive",
        });
      } else if (stockQty <= minLevel) {
        // Low stock
        addNotification({
          type: "inventory",
          title: "⚠️ Low Stock Warning",
          description: `${product.name} is running low (${stockQty} remaining)`,
        });
        toast({
          title: "⚠️ Low Stock Warning",
          description: `${product.name} is running low (${stockQty} remaining)`,
        });
      }
    },
    [toast, addNotification]
  );

  const handleInvoiceChange = useCallback(
    (payload: NotificationPayload) => {
      if (payload.eventType === "INSERT") {
        const invoice = payload.new as {
          invoice_number?: string;
          total?: number;
        };
        addNotification({
          type: "payment",
          title: "💰 New Invoice Created",
          description: `Invoice ${invoice?.invoice_number || ""} for KES ${invoice?.total?.toLocaleString() || 0}`,
        });
        toast({
          title: "💰 New Invoice Created",
          description: `Invoice ${invoice?.invoice_number || ""} for KES ${invoice?.total?.toLocaleString() || 0}`,
        });
      } else if (payload.eventType === "UPDATE") {
        const updated = payload.new as {
          status?: string;
          invoice_number?: string;
          total?: number;
        };
        if (updated?.status === "paid") {
          addNotification({
            type: "payment",
            title: "💳 Payment Received",
            description: `Invoice ${updated?.invoice_number || ""} paid - KES ${updated?.total?.toLocaleString() || 0}`,
          });
          toast({
            title: "💳 Payment Received",
            description: `Invoice ${updated?.invoice_number || ""} paid - KES ${updated?.total?.toLocaleString() || 0}`,
          });
        }
      }
    },
    [toast, addNotification]
  );

  useEffect(() => {
    if (!profile) return;

    const branchId = profile.branch_id;

    // Set up realtime subscriptions
    const appointmentsChannel = supabase
      .channel("realtime-appointments")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          ...(isSuperAdmin ? {} : { filter: `branch_id=eq.${branchId}` }),
        },
        (payload) =>
          handleAppointmentChange({
            eventType: payload.eventType,
            new: payload.new as Record<string, unknown>,
            old: payload.old as Record<string, unknown>,
          })
      )
      .subscribe();

    const inventoryChannel = supabase
      .channel("realtime-inventory")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "inventory_products",
          ...(isSuperAdmin ? {} : { filter: `branch_id=eq.${branchId}` }),
        },
        (payload) =>
          handleInventoryChange({
            eventType: payload.eventType,
            new: payload.new as Record<string, unknown>,
            old: payload.old as Record<string, unknown>,
          })
      )
      .subscribe();

    const invoicesChannel = supabase
      .channel("realtime-invoices")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoices",
          ...(isSuperAdmin ? {} : { filter: `branch_id=eq.${branchId}` }),
        },
        (payload) =>
          handleInvoiceChange({
            eventType: payload.eventType,
            new: payload.new as Record<string, unknown>,
            old: payload.old as Record<string, unknown>,
          })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(inventoryChannel);
      supabase.removeChannel(invoicesChannel);
    };
  }, [
    profile,
    isSuperAdmin,
    handleAppointmentChange,
    handleInventoryChange,
    handleInvoiceChange,
  ]);

  return {
    notifications,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  };
}

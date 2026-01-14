-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
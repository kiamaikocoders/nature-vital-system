import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProductData {
  name: string;
  currentStock: number;
  avgDailySales: number;
  minStockLevel: number;
  branch: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { products } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const productSummary = (products as ProductData[]).map(p => 
      `- ${p.name} at ${p.branch}: ${p.currentStock} units, avg ${p.avgDailySales.toFixed(1)} sales/day, min level: ${p.minStockLevel}`
    ).join("\n");

    const systemPrompt = `You are an inventory analyst for Nature Vital Wellness Center, a health clinic chain in Kenya.
Analyze the following product inventory data and provide insights.

IMPORTANT FORMATTING RULES:
- Do NOT use any markdown formatting (no #, ##, ###, **, *, or tables with |)
- Use plain text only
- For lists, use simple numbered format like "1." or "2." with a space after
- Use line breaks to separate sections
- Keep responses clean and easy to read
- Use bullet points with "•" symbol for sub-items if needed

Your analysis should cover:
1. Stockout urgency analysis for each product
2. Recommended reorder quantities  
3. Key patterns across branches
4. Priority actions needed

Use KES for any monetary values.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this inventory data and predict stockouts:\n\n${productSummary}` }
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "Unable to generate forecast.";

    // Calculate basic predictions
    const predictions = (products as ProductData[]).map(p => {
      const daysUntilStockout = p.avgDailySales > 0 ? Math.floor(p.currentStock / p.avgDailySales) : 999;
      const urgency = daysUntilStockout < 7 ? "critical" : daysUntilStockout < 14 ? "warning" : "good";
      const reorderQty = Math.ceil(p.avgDailySales * 30); // 30-day supply
      
      return {
        ...p,
        daysUntilStockout,
        urgency,
        reorderQty,
        stockoutDate: new Date(Date.now() + daysUntilStockout * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
    });

    return new Response(JSON.stringify({ analysis, predictions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Inventory forecast error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

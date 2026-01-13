import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NATURE_VITAL_PRODUCTS = [
  {
    name: "PureFlow Detox",
    category: "Detox",
    benefits: "Supports liver function, removes toxins, promotes digestive health",
    indications: ["fatigue", "digestive issues", "skin problems", "bloating", "constipation", "toxin buildup", "sluggish liver"]
  },
  {
    name: "VitalCal Plus",
    category: "Bone Health",
    benefits: "Calcium supplement with Vitamin D3 for bone strength and muscle function",
    indications: ["bone pain", "joint pain", "muscle cramps", "weak bones", "osteoporosis risk", "fracture history", "vitamin d deficiency"]
  },
  {
    name: "NeuroVital",
    category: "Brain Health",
    benefits: "Supports cognitive function, memory, focus, and nervous system health",
    indications: ["memory problems", "brain fog", "lack of focus", "anxiety", "stress", "mental fatigue", "concentration issues", "cognitive decline"]
  },
  {
    name: "Super Detox",
    category: "Deep Cleanse",
    benefits: "Intensive detoxification formula for whole-body cleanse",
    indications: ["chronic fatigue", "weight issues", "metabolic syndrome", "heavy metal exposure", "chemical sensitivity", "allergies", "inflammation"]
  },
  {
    name: "ImmunoBoost",
    category: "Immunity",
    benefits: "Strengthens immune system with natural herbs and vitamins",
    indications: ["frequent colds", "weak immunity", "slow healing", "infections", "low energy", "seasonal allergies", "immune deficiency"]
  },
  {
    name: "CardioHealth",
    category: "Heart Health",
    benefits: "Supports cardiovascular function, healthy blood pressure, and circulation",
    indications: ["high blood pressure", "cholesterol issues", "heart palpitations", "poor circulation", "chest discomfort", "cardiovascular risk"]
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symptoms, patientHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a clinical assistant for Nature Vital Wellness Center, a holistic health clinic in Kenya. 
Your role is to suggest appropriate Nature-Vital supplements based on patient symptoms.

Available Nature-Vital Products:
${NATURE_VITAL_PRODUCTS.map(p => `- ${p.name} (${p.category}): ${p.benefits}. Good for: ${p.indications.join(", ")}`).join("\n")}

Guidelines:
1. Analyze the symptoms carefully
2. Suggest 1-3 most relevant supplements with clear reasoning
3. Always recommend consulting with the doctor for final decision
4. Consider the 80/20 Alkaline-Acidic diet principle
5. Be professional and evidence-based
6. Format suggestions clearly with product name, reason, and dosage recommendation`;

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
          { 
            role: "user", 
            content: `Patient symptoms: ${symptoms}${patientHistory ? `\n\nPatient medical history: ${patientHistory}` : ''}\n\nPlease suggest appropriate Nature-Vital supplements for this patient.`
          }
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
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please contact admin." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content || "Unable to generate suggestions.";

    return new Response(JSON.stringify({ suggestion, products: NATURE_VITAL_PRODUCTS }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Clinical assistant error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

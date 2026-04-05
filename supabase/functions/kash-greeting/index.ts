import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userName, totalIncome, totalExpense, netBalance, savingsProgress, savingsGoal, topCategories, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt: string;
    let userPrompt: string;

    if (type === "monthly-insight") {
      systemPrompt = `You are Kash the Cat, a sassy financial assistant cat mascot. You speak with cat puns (meow, paws, purr, hiss, fur-tunate, etc). You give brief, insightful monthly financial reviews. Keep it under 3 sentences. Be encouraging but honest about overspending. Use emojis sparingly (1-2 max).`;
      userPrompt = `Give a monthly review for ${userName || 'my human'}. Income: $${totalIncome}, Expenses: $${totalExpense}, Net: $${netBalance}, Savings: $${savingsProgress}${savingsGoal ? ` of $${savingsGoal} goal` : ''}. Top spending categories: ${topCategories || 'none'}. Was this a good or bad month?`;
    } else {
      systemPrompt = `You are Kash the Cat, a sassy financial assistant cat mascot. You greet users with personality, cat puns, and sometimes share a quick financial tip, money news, or investment insight. Keep it to 2 sentences max. Be warm, fun, and relevant. Use emojis sparingly (1-2 max). Never repeat the same greeting.`;
      userPrompt = `Greet ${userName || 'my human'} who just logged in. Their current financial snapshot: Income this month: $${totalIncome || 0}, Spent: $${totalExpense || 0}, Net balance: $${netBalance || 0}. Give a personalized greeting with a financial tip or interesting money fact. Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.`;
    }

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const result = await response.json();
    const message = result.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Category = "smart" | "stocks" | "savings" | "coach" | "summary" | "funny";

const CATEGORY_PROMPTS: Record<Category, string> = {
  smart: `Give a smart financial insight based on the user's snapshot. Focus on budget progress, spending trend, monthly surplus/deficit, or savings pace. Be specific to the numbers provided.`,
  stocks: `Share a brief stock market note (S&P 500, Nasdaq, or Dow Jones) or an investing reminder. Use general market wisdom — do NOT invent today's exact prices. Frame it as a tip or perspective.`,
  savings: `Give a short, encouraging message about saving money, consistency, or working toward goals. Reference their savings progress if shown.`,
  coach: `Act as an AI budget coach. Give one concrete recommendation based on their numbers — e.g. reduce dining out, invest the surplus, move money to savings, watch a category.`,
  summary: `Give a quick monthly expense summary highlight — top spending area, totals, or budget remaining. Be punchy.`,
  funny: `Make a playful, funny cat comment about money, spending, payday, or financial discipline. Heavy on cat puns and humor.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      userName,
      totalIncome,
      totalExpense,
      netBalance,
      savingsProgress,
      savingsGoal,
      topCategories,
      type,
      category = "smart",
      length = "short",
      humor = true,
    } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt: string;
    let userPrompt: string;

    if (type === "monthly-insight") {
      systemPrompt = `You are Kash the Cat, a sassy financial assistant cat mascot. You speak with cat puns (meow, paws, purr, hiss, fur-tunate, etc). You give brief, insightful monthly financial reviews. Keep it under 3 sentences. Be encouraging but honest about overspending. Use emojis sparingly (1-2 max).`;
      userPrompt = `Give a monthly review for ${userName || 'my human'}. Income: $${totalIncome}, Expenses: $${totalExpense}, Net: $${netBalance}, Savings: $${savingsProgress}${savingsGoal ? ` of $${savingsGoal} goal` : ''}. Top spending categories: ${topCategories || 'none'}. Was this a good or bad month?`;
    } else {
      const cat = (CATEGORY_PROMPTS[category as Category] ? category : "smart") as Category;
      const lengthRule = length === "detailed"
        ? "Use 3-4 sentences with concrete details."
        : "Keep it to 1-2 sentences max.";
      const humorRule = humor
        ? "Use cat puns (meow, paws, purr, hiss, fur-tunate) and a playful sassy tone."
        : "Be friendly and clear, minimal cat puns, more professional.";

      systemPrompt = `You are Kash the Cat, a financial assistant cat mascot. ${humorRule} ${lengthRule} Use emojis sparingly (1-2 max). Never repeat the same greeting.`;
      userPrompt = `${CATEGORY_PROMPTS[cat]}

User: ${userName || 'my human'}
Income this month: $${totalIncome || 0}
Spent: $${totalExpense || 0}
Net balance: $${netBalance || 0}
Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`;
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

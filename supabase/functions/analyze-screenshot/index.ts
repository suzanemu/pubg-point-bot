import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    console.log("Analyzing screenshot:", imageUrl);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Use Gemini 2.5 Flash for vision analysis (multimodal)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are analyzing PUBG Mobile match result screenshots. Extract the following information:
1. Placement (rank) - look for numbers like "#1", "#2", "Winner Winner Chicken Dinner", "1st Place", etc.
2. Kills count - look for kill statistics, eliminations, or kill count

Return ONLY a JSON object with this exact structure:
{"placement": <number 1-16>, "kills": <number>}

If you cannot find the information, use: {"placement": null, "kills": null}

Important: Extract placement as a number from 1-16. Common indicators:
- "Winner Winner Chicken Dinner" or "#1" = placement 1
- "#2" or "2nd Place" = placement 2
- Look for rank/position numbers on the screen`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this PUBG Mobile match result screenshot and extract the placement (1-16) and kills count."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", data);

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let result;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[^}]+\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    console.log("Parsed result:", result);

    // Validate the result
    if (result.placement !== null && (result.placement < 1 || result.placement > 16)) {
      console.error("Invalid placement:", result.placement);
      result.placement = null;
    }

    if (result.kills !== null && result.kills < 0) {
      console.error("Invalid kills:", result.kills);
      result.kills = null;
    }

    return new Response(
      JSON.stringify({
        placement: result.placement,
        kills: result.kills || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error analyzing screenshot:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze screenshot";
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        placement: null,
        kills: null
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { tripId, sessionToken, message } = await req.json();

    if (!tripId || !sessionToken || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const googleApiKey = Deno.env.get("GOOGLE_SEARCH_API_KEY");
    const googleCseId = Deno.env.get("GOOGLE_SEARCH_CSE_ID");

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: trip, error: tripError } = await supabase
      .from("travel_trips")
      .select("*")
      .eq("id", tripId)
      .single();

    if (tripError || !trip) {
      return new Response(
        JSON.stringify({ error: "Trip not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: intake } = await supabase
      .from("travel_intakes")
      .select("*")
      .eq("session_token", sessionToken)
      .single();

    const { data: conversationHistory } = await supabase
      .from("travel_conversations")
      .select("*")
      .eq("session_token", sessionToken)
      .order("created_at", { ascending: true })
      .limit(10);

    let searchResults = "";
    if (googleApiKey && googleCseId) {
      try {
        const searchQuery = `${message} ${trip.name}`;
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(searchQuery)}&num=3`;
        
        const searchResponse = await fetch(searchUrl);
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.items && searchData.items.length > 0) {
            searchResults = "\n\nRelevante zoekresultaten:\n" + searchData.items
              .map((item: any) => `- ${item.title}: ${item.snippet}`)
              .join("\n");
          }
        }
      } catch (error) {
        console.error("Search error:", error);
      }
    }

    const systemPrompt = `Je bent TravelBRO, een vriendelijke en behulpzame Nederlandse reisassistent voor de reis "${trip.name}". 

Reis informatie:
${JSON.stringify(trip.parsed_data, null, 2)}

Extra informatie bronnen:
${trip.source_urls.join("\n")}

Reiziger informatie:
${intake ? JSON.stringify(intake.intake_data, null, 2) : "Geen intake data beschikbaar"}

Geef persoonlijke, vriendelijke adviezen gebaseerd op de reiziger informatie. Als het om kinderen gaat, geef dan tips die aansluiten bij hun interesses (gaming, TikTok, tekenen, etc.).

Wees altijd positief, behulpzaam en enthousiast over de reis. Gebruik emoji's waar passend. Houd antwoorden kort en to the point tenzij meer detail gevraagd wordt.${searchResults}`;

    const messages = [
      { role: "system", content: systemPrompt },
    ];

    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((conv: any) => {
        messages.push({
          role: conv.role,
          content: conv.message,
        });
      });
    }

    messages.push({ role: "user", content: message });

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error("OpenAI API error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response", details: error }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0].message.content;

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in travelbro-chat:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
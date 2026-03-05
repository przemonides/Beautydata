import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { client_id } = await request.json();

    if (!client_id) {
      return NextResponse.json(
        { error: "Brak client_id" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Verify user is logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Nie jesteś zalogowany" },
        { status: 401 }
      );
    }

    // Get salon
    const { data: salon } = await supabase
      .from("salons")
      .select("id")
      .eq("owner_email", user.email!)
      .single();

    if (!salon) {
      return NextResponse.json(
        { error: "Nie znaleziono salonu" },
        { status: 404 }
      );
    }

    // Get client info
    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("id", client_id)
      .eq("salon_id", salon.id)
      .single();

    if (!client) {
      return NextResponse.json(
        { error: "Nie znaleziono klienta" },
        { status: 404 }
      );
    }

    // Get visit history with services
    const { data: visits } = await supabase
      .from("visits")
      .select("*, services(name, category, price)")
      .eq("client_id", client_id)
      .eq("salon_id", salon.id)
      .order("visit_date", { ascending: false });

    // Build context for Claude
    const visitHistory = (visits || [])
      .map((v: any) => {
        const serviceName = v.services?.name || "Nieznana usługa";
        const category = v.services?.category || "";
        const price = v.price_paid != null ? `${v.price_paid} zł` : "brak ceny";
        return `- ${v.visit_date}: ${serviceName}${category ? ` (${category})` : ""}, ${price}`;
      })
      .join("\n");

    const clientInfo = `Klient: ${client.first_name} ${client.last_name}`;
    const historyText =
      visitHistory || "Brak historii wizyt.";

    const userMessage = `${clientInfo}\n\nHistoria wizyt:\n${historyText}`;

    // Call Claude API
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: "Brak klucza API Anthropic. Skonfiguruj ANTHROPIC_API_KEY." },
        { status: 500 }
      );
    }

    const claudeResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          system:
            "Jesteś asystentem dla salonu beauty. Na podstawie historii wizyt klientki/klienta zaproponuj spersonalizowaną rekomendację kolejnego zabiegu. Odpowiedz po polsku, max 3 zdania, konkretnie i ciepło.",
          messages: [
            {
              role: "user",
              content: userMessage,
            },
          ],
        }),
      }
    );

    if (!claudeResponse.ok) {
      const errBody = await claudeResponse.text();
      console.error("Claude API error:", errBody);
      return NextResponse.json(
        { error: "Błąd podczas komunikacji z API Claude" },
        { status: 500 }
      );
    }

    const claudeData = await claudeResponse.json();
    const recommendationText =
      claudeData.content?.[0]?.text || "Nie udało się wygenerować rekomendacji.";

    // Save to database
    const { error: insertError } = await supabase
      .from("recommendations")
      .insert({
        salon_id: salon.id,
        client_id: client_id,
        recommendation_text: recommendationText,
      });

    if (insertError) {
      console.error("Insert recommendation error:", insertError);
      return NextResponse.json(
        { error: "Nie udało się zapisać rekomendacji" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      recommendation: recommendationText,
    });
  } catch (error) {
    console.error("Recommendation generation error:", error);
    return NextResponse.json(
      { error: "Wystąpił nieoczekiwany błąd" },
      { status: 500 }
    );
  }
}

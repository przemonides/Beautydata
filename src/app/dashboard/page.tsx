import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentSalon } from "@/lib/salon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarCheck, AlertTriangle, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const salon = await getCurrentSalon();

  // Total clients
  const { count: clientCount } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("salon_id", salon.id);

  // Visits this month
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const { count: visitsThisMonth } = await supabase
    .from("visits")
    .select("*", { count: "exact", head: true })
    .eq("salon_id", salon.id)
    .gte("visit_date", firstOfMonth);

  // Churn risk: clients with no visit in 60+ days
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: allClients } = await supabase
    .from("clients")
    .select("id, first_name, last_name")
    .eq("salon_id", salon.id);

  let churnClients: { id: string; first_name: string; last_name: string }[] = [];

  if (allClients && allClients.length > 0) {
    // Get latest visit per client
    const { data: recentVisits } = await supabase
      .from("visits")
      .select("client_id, visit_date")
      .eq("salon_id", salon.id)
      .gte("visit_date", sixtyDaysAgo);

    const recentClientIds = new Set(
      (recentVisits || []).map((v) => v.client_id)
    );

    churnClients = allClients.filter((c) => !recentClientIds.has(c.id));
  }

  // Latest 5 recommendations
  const { data: recommendations } = await supabase
    .from("recommendations")
    .select("*, clients(first_name, last_name)")
    .eq("salon_id", salon.id)
    .order("generated_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pulpit</h1>
        <p className="text-muted-foreground">
          Witaj w {salon.name}! Oto podsumowanie Twojego salonu.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Klienci</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{clientCount || 0}</div>
            <p className="text-xs text-muted-foreground">Łączna liczba klientów</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Wizyty w tym miesiącu
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{visitsThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">Od {firstOfMonth}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ryzyko odejścia
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {churnClients.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Brak wizyty od 60+ dni
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Churn risk clients */}
      {churnClients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Klienci zagrożeni odejściem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {churnClients.slice(0, 10).map((client) => (
                <Link
                  key={client.id}
                  href={`/dashboard/klienci/${client.id}`}
                  className="block p-3 rounded-md bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <span className="font-medium">
                    {client.first_name} {client.last_name}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    — brak niedawnej wizyty
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Latest recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Ostatnie rekomendacje AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations && recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec: any) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-md bg-rose-50 border border-rose-100"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {rec.clients?.first_name} {rec.clients?.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(rec.generated_at).toLocaleDateString("pl-PL")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {rec.recommendation_text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Brak rekomendacji. Przejdź do profilu klienta i kliknij &quot;Generuj
              rekomendację AI&quot;, aby wygenerować pierwszą.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentSalon } from "@/lib/salon";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User, Phone, Mail, Cake, FileText, Sparkles } from "lucide-react";
import { GenerateRecommendationButton } from "./generate-recommendation-button";

export default async function ClientProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabaseClient();
  const salon = await getCurrentSalon();

  // Fetch client
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .eq("salon_id", salon.id)
    .single();

  if (!client) {
    notFound();
  }

  // Fetch visits with service info
  const { data: visits } = await supabase
    .from("visits")
    .select("*, services(name, category)")
    .eq("client_id", client.id)
    .eq("salon_id", salon.id)
    .order("visit_date", { ascending: false });

  // Fetch latest recommendation
  const { data: recommendations } = await supabase
    .from("recommendations")
    .select("*")
    .eq("client_id", client.id)
    .eq("salon_id", salon.id)
    .order("generated_at", { ascending: false })
    .limit(1);

  const latestRecommendation = recommendations?.[0] || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {client.first_name} {client.last_name}
        </h1>
        <p className="text-muted-foreground">Profil klienta</p>
      </div>

      {/* Client details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Dane klienta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {client.first_name} {client.last_name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{client.phone || "Brak telefonu"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{client.email || "Brak emaila"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Cake className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {client.birthdate
                  ? new Date(client.birthdate).toLocaleDateString("pl-PL")
                  : "Brak daty urodzin"}
              </span>
            </div>
            {client.notes && (
              <div className="col-span-full flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm">{client.notes}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Rekomendacja AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {latestRecommendation ? (
            <div className="p-4 rounded-md bg-rose-50 border border-rose-100">
              <p className="text-sm text-gray-700">
                {latestRecommendation.recommendation_text}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Wygenerowano:{" "}
                {new Date(latestRecommendation.generated_at).toLocaleDateString(
                  "pl-PL"
                )}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Brak rekomendacji dla tego klienta.
            </p>
          )}
          <GenerateRecommendationButton clientId={client.id} />
        </CardContent>
      </Card>

      {/* Visit history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historia wizyt</CardTitle>
        </CardHeader>
        <CardContent>
          {visits && visits.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Usługa</TableHead>
                  <TableHead>Kategoria</TableHead>
                  <TableHead className="text-right">Cena</TableHead>
                  <TableHead>Notatki</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map((visit: any) => (
                  <TableRow key={visit.id}>
                    <TableCell>
                      {new Date(visit.visit_date).toLocaleDateString("pl-PL")}
                    </TableCell>
                    <TableCell>
                      {visit.services?.name || "—"}
                    </TableCell>
                    <TableCell>
                      {visit.services?.category ? (
                        <Badge variant="secondary">
                          {visit.services.category}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {visit.price_paid != null
                        ? `${Number(visit.price_paid).toFixed(2)} zł`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {visit.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              Brak wizyt dla tego klienta.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

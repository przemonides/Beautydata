import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentSalon } from "@/lib/salon";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ClientSearch } from "./client-search";

export default async function KlienciPage() {
  const supabase = createServerSupabaseClient();
  const salon = await getCurrentSalon();

  // Get all clients with visit count and last visit
  const { data: clients } = await supabase
    .from("clients")
    .select("*, visits(visit_date)")
    .eq("salon_id", salon.id)
    .order("last_name", { ascending: true });

  const clientsWithStats = (clients || []).map((client: any) => {
    const visits = client.visits || [];
    const visitCount = visits.length;
    const lastVisit = visits.length
      ? visits
          .map((v: any) => v.visit_date)
          .sort()
          .reverse()[0]
      : null;
    return {
      id: client.id,
      first_name: client.first_name,
      last_name: client.last_name,
      phone: client.phone,
      email: client.email,
      visit_count: visitCount,
      last_visit: lastVisit,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Klienci</h1>
          <p className="text-muted-foreground">
            Zarządzaj bazą klientów swojego salonu
          </p>
        </div>
        <Link href="/dashboard/klienci/nowy">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj klienta
          </Button>
        </Link>
      </div>

      <ClientSearch clients={clientsWithStats} />
    </div>
  );
}

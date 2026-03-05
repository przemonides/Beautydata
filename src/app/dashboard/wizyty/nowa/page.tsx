"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { Client, Service } from "@/lib/types";

export default function NowaWizytaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: salon } = await supabase
        .from("salons")
        .select("id")
        .eq("owner_email", user.email!)
        .single();

      if (!salon) return;

      const [clientsRes, servicesRes] = await Promise.all([
        supabase
          .from("clients")
          .select("*")
          .eq("salon_id", salon.id)
          .order("last_name"),
        supabase.from("services").select("*").eq("salon_id", salon.id).order("name"),
      ]);

      setClients(clientsRes.data || []);
      setServices(servicesRes.data || []);
    };
    fetchData();
  }, [supabase]);

  // Auto-fill price when service changes
  useEffect(() => {
    if (selectedService) {
      const service = services.find((s) => s.id === selectedService);
      if (service?.price != null) {
        setPrice(String(service.price));
      }
    }
  }, [selectedService, services]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Nie jesteś zalogowany");
      setLoading(false);
      return;
    }

    const { data: salon } = await supabase
      .from("salons")
      .select("id")
      .eq("owner_email", user.email!)
      .single();

    if (!salon) {
      setError("Nie znaleziono salonu");
      setLoading(false);
      return;
    }

    const clientId = formData.get("client_id") as string;
    const serviceId = (formData.get("service_id") as string) || null;
    const visitDate = formData.get("visit_date") as string;
    const pricePaid = formData.get("price_paid") as string;
    const notes = (formData.get("notes") as string) || null;

    const { error: insertError } = await supabase.from("visits").insert({
      salon_id: salon.id,
      client_id: clientId,
      service_id: serviceId || null,
      visit_date: visitDate,
      price_paid: pricePaid ? parseFloat(pricePaid) : null,
      notes,
    });

    if (insertError) {
      setError("Nie udało się zapisać wizyty: " + insertError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard/klienci");
    router.refresh();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Nowa wizyta</h1>
        <p className="text-muted-foreground">
          Zarejestruj nową wizytę klienta w salonie
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Szczegóły wizyty</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Klient *</Label>
              <Select id="client_id" name="client_id" required>
                <option value="">Wybierz klienta...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                    {c.phone ? ` (${c.phone})` : ""}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_id">Usługa</Label>
              <Select
                id="service_id"
                name="service_id"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
              >
                <option value="">Wybierz usługę...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.category ? ` (${s.category})` : ""}
                    {s.price != null ? ` — ${s.price} zł` : ""}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="visit_date">Data wizyty *</Label>
                <Input
                  id="visit_date"
                  name="visit_date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_paid">Cena (zł)</Label>
                <Input
                  id="price_paid"
                  name="price_paid"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notatki</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Dodatkowe uwagi do wizyty..."
                rows={3}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Zapisz wizytę
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NowyKlientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    // Get current user and salon
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

    const { error: insertError } = await supabase.from("clients").insert({
      salon_id: salon.id,
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      birthdate: (formData.get("birthdate") as string) || null,
      notes: (formData.get("notes") as string) || null,
    });

    if (insertError) {
      setError("Nie udało się dodać klienta: " + insertError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard/klienci");
    router.refresh();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/dashboard/klienci"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Powrót do listy klientów
        </Link>
        <h1 className="text-2xl font-bold">Nowy klient</h1>
        <p className="text-muted-foreground">
          Wypełnij formularz, aby dodać nowego klienta
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dane klienta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">Imię *</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  placeholder="Anna"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Nazwisko *</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  placeholder="Kowalska"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+48 123 456 789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="anna@email.pl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthdate">Data urodzin</Label>
              <Input id="birthdate" name="birthdate" type="date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notatki</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Dodatkowe informacje o kliencie..."
                rows={3}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Dodaj klienta
              </Button>
              <Link href="/dashboard/klienci">
                <Button type="button" variant="outline">
                  Anuluj
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

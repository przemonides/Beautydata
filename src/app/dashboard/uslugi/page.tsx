"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import type { Service } from "@/lib/types";

const CATEGORIES = ["Włosy", "Paznokcie", "Twarz", "Depilacja", "Ciało", "Inne"];

export default function UslugiPage() {
  const supabase = createClient();
  const [services, setServices] = useState<Service[]>([]);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");

  const fetchServices = useCallback(async () => {
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
    setSalonId(salon.id);

    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("salon_id", salon.id)
      .order("category")
      .order("name");

    setServices(data || []);
  }, [supabase]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const resetForm = () => {
    setName("");
    setCategory("");
    setDuration("");
    setPrice("");
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const startEdit = (service: Service) => {
    setName(service.name);
    setCategory(service.category || "");
    setDuration(service.duration_minutes?.toString() || "");
    setPrice(service.price?.toString() || "");
    setEditingId(service.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonId) return;
    setLoading(true);
    setError("");

    const payload = {
      salon_id: salonId,
      name,
      category: category || null,
      duration_minutes: duration ? parseInt(duration) : null,
      price: price ? parseFloat(price) : null,
    };

    if (editingId) {
      const { error: updateError } = await supabase
        .from("services")
        .update(payload)
        .eq("id", editingId);

      if (updateError) {
        setError("Nie udało się zaktualizować usługi");
        setLoading(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from("services")
        .insert(payload);

      if (insertError) {
        setError("Nie udało się dodać usługi");
        setLoading(false);
        return;
      }
    }

    resetForm();
    setLoading(false);
    fetchServices();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tę usługę?")) return;

    await supabase.from("services").delete().eq("id", id);
    fetchServices();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usługi</h1>
          <p className="text-muted-foreground">
            Zarządzaj usługami oferowanymi przez salon
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj usługę
          </Button>
        )}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {editingId ? "Edytuj usługę" : "Nowa usługa"}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nazwa usługi *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="np. Strzyżenie damskie"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Kategoria</Label>
                  <Select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Wybierz kategorię...</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="duration">Czas trwania (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Cena (zł)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="100.00"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingId ? "Zapisz zmiany" : "Dodaj usługę"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Anuluj
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Services table */}
      {services.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Brak usług. Dodaj pierwszą usługę, aby rozpocząć.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nazwa</TableHead>
                <TableHead>Kategoria</TableHead>
                <TableHead>Czas (min)</TableHead>
                <TableHead className="text-right">Cena (zł)</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>
                    {service.category ? (
                      <Badge variant="secondary">{service.category}</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {service.duration_minutes ? `${service.duration_minutes} min` : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {service.price != null
                      ? `${Number(service.price).toFixed(2)} zł`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(service)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(service.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

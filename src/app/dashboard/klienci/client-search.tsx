"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";

interface ClientRow {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  visit_count: number;
  last_visit: string | null;
}

export function ClientSearch({ clients }: { clients: ClientRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = clients.filter((c) => {
    const q = query.toLowerCase();
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
    const phone = (c.phone || "").toLowerCase();
    return fullName.includes(q) || phone.includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Szukaj po imieniu, nazwisku lub telefonie..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {query
            ? "Nie znaleziono klientów pasujących do wyszukiwania."
            : "Brak klientów. Dodaj pierwszego klienta!"}
        </p>
      ) : (
        <div className="border rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imię i nazwisko</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Ostatnia wizyta</TableHead>
                <TableHead className="text-right">Liczba wizyt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/klienci/${client.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {client.first_name} {client.last_name}
                    </Link>
                  </TableCell>
                  <TableCell>{client.phone || "—"}</TableCell>
                  <TableCell>
                    {client.last_visit
                      ? new Date(client.last_visit).toLocaleDateString("pl-PL")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {client.visit_count}
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

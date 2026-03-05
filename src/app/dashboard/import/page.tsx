"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileUp, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const FIELD_OPTIONS = [
  { value: "", label: "— Pomiń —" },
  { value: "first_name", label: "Imię" },
  { value: "last_name", label: "Nazwisko" },
  { value: "phone", label: "Telefon" },
  { value: "email", label: "Email" },
  { value: "visit_date", label: "Data wizyty" },
  { value: "service_name", label: "Usługa" },
  { value: "price", label: "Cena" },
];

type ColumnMapping = Record<string, string>;

export default function ImportPage() {
  const supabase = createClient();
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [fileName, setFileName] = useState("");

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileName(file.name);
      setResult(null);

      Papa.parse(file, {
        complete: (results) => {
          const data = results.data as string[][];
          if (data.length < 2) {
            setResult({
              success: false,
              message: "Plik jest pusty lub zawiera tylko nagłówki.",
            });
            return;
          }

          const fileHeaders = data[0];
          setHeaders(fileHeaders);
          setCsvData(data.slice(1).filter((row) => row.some((cell) => cell.trim())));

          // Auto-map columns by guessing
          const mapping: ColumnMapping = {};
          fileHeaders.forEach((header) => {
            const h = header.toLowerCase().trim();
            if (h.includes("imię") || h.includes("imie") || h === "first_name")
              mapping[header] = "first_name";
            else if (
              h.includes("nazwisko") ||
              h === "last_name" ||
              h === "surname"
            )
              mapping[header] = "last_name";
            else if (h.includes("telefon") || h.includes("phone") || h === "tel")
              mapping[header] = "phone";
            else if (h.includes("email") || h.includes("e-mail"))
              mapping[header] = "email";
            else if (
              h.includes("data") ||
              h.includes("wizyta") ||
              h.includes("date")
            )
              mapping[header] = "visit_date";
            else if (
              h.includes("usługa") ||
              h.includes("usluga") ||
              h.includes("service") ||
              h.includes("zabieg")
            )
              mapping[header] = "service_name";
            else if (h.includes("cena") || h.includes("price") || h.includes("kwota"))
              mapping[header] = "price";
          });
          setColumnMapping(mapping);
        },
        skipEmptyLines: true,
      });
    },
    []
  );

  const getColumnIndex = (fieldName: string): number => {
    const header = Object.entries(columnMapping).find(
      ([, value]) => value === fieldName
    )?.[0];
    if (!header) return -1;
    return headers.indexOf(header);
  };

  const handleImport = async () => {
    setImporting(true);
    setResult(null);

    const firstNameIdx = getColumnIndex("first_name");
    const lastNameIdx = getColumnIndex("last_name");

    if (firstNameIdx === -1 || lastNameIdx === -1) {
      setResult({
        success: false,
        message: 'Musisz zmapować kolumny "Imię" i "Nazwisko".',
      });
      setImporting(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setResult({ success: false, message: "Nie jesteś zalogowany." });
      setImporting(false);
      return;
    }

    const { data: salon } = await supabase
      .from("salons")
      .select("id")
      .eq("owner_email", user.email!)
      .single();

    if (!salon) {
      setResult({ success: false, message: "Nie znaleziono salonu." });
      setImporting(false);
      return;
    }

    const phoneIdx = getColumnIndex("phone");
    const emailIdx = getColumnIndex("email");
    const visitDateIdx = getColumnIndex("visit_date");
    const serviceIdx = getColumnIndex("service_name");
    const priceIdx = getColumnIndex("price");

    let importedClients = 0;
    let importedVisits = 0;
    let errors = 0;

    // Group rows by client (first_name + last_name + phone)
    const clientMap = new Map<
      string,
      { first_name: string; last_name: string; phone?: string; email?: string; visits: any[] }
    >();

    for (const row of csvData) {
      const firstName = row[firstNameIdx]?.trim();
      const lastName = row[lastNameIdx]?.trim();
      if (!firstName || !lastName) {
        errors++;
        continue;
      }

      const phone = phoneIdx >= 0 ? row[phoneIdx]?.trim() : undefined;
      const email = emailIdx >= 0 ? row[emailIdx]?.trim() : undefined;
      const key = `${firstName}|${lastName}|${phone || ""}`;

      if (!clientMap.has(key)) {
        clientMap.set(key, {
          first_name: firstName,
          last_name: lastName,
          phone: phone || undefined,
          email: email || undefined,
          visits: [],
        });
      }

      // Check if there's visit data
      const visitDate =
        visitDateIdx >= 0 ? row[visitDateIdx]?.trim() : undefined;
      if (visitDate) {
        clientMap.get(key)!.visits.push({
          visit_date: visitDate,
          service_name:
            serviceIdx >= 0 ? row[serviceIdx]?.trim() : undefined,
          price: priceIdx >= 0 ? row[priceIdx]?.trim() : undefined,
        });
      }
    }

    // Import clients and their visits
    for (const [, clientData] of clientMap) {
      const { data: insertedClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          salon_id: salon.id,
          first_name: clientData.first_name,
          last_name: clientData.last_name,
          phone: clientData.phone || null,
          email: clientData.email || null,
        })
        .select("id")
        .single();

      if (clientError || !insertedClient) {
        errors++;
        continue;
      }
      importedClients++;

      // Import visits for this client
      for (const visit of clientData.visits) {
        // Try to parse date
        let parsedDate = visit.visit_date;
        // Try common Polish date format dd.mm.yyyy or dd/mm/yyyy
        const dateMatch = parsedDate.match(
          /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/
        );
        if (dateMatch) {
          parsedDate = `${dateMatch[3]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[1].padStart(2, "0")}`;
        }

        // Find or create service if provided
        let serviceId = null;
        if (visit.service_name) {
          const { data: existingService } = await supabase
            .from("services")
            .select("id")
            .eq("salon_id", salon.id)
            .eq("name", visit.service_name)
            .single();

          if (existingService) {
            serviceId = existingService.id;
          } else {
            const { data: newService } = await supabase
              .from("services")
              .insert({
                salon_id: salon.id,
                name: visit.service_name,
              })
              .select("id")
              .single();
            serviceId = newService?.id || null;
          }
        }

        const { error: visitError } = await supabase.from("visits").insert({
          salon_id: salon.id,
          client_id: insertedClient.id,
          service_id: serviceId,
          visit_date: parsedDate,
          price_paid: visit.price ? parseFloat(visit.price) : null,
        });

        if (!visitError) {
          importedVisits++;
        } else {
          errors++;
        }
      }
    }

    setResult({
      success: true,
      message: `Import zakończony! Dodano ${importedClients} klientów i ${importedVisits} wizyt.${errors > 0 ? ` Pominięto ${errors} wierszy z błędami.` : ""}`,
    });
    setImporting(false);
  };

  const previewRows = csvData.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import CSV</h1>
        <p className="text-muted-foreground">
          Zaimportuj klientów i wizyty z pliku CSV
        </p>
      </div>

      {/* File upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Plik CSV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex flex-col items-center">
              <FileUp className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {fileName || "Kliknij, aby wybrać plik CSV"}
              </p>
            </div>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </CardContent>
      </Card>

      {/* Column mapping */}
      {headers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mapowanie kolumn</CardTitle>
            <p className="text-sm text-muted-foreground">
              Dopasuj kolumny z CSV do odpowiednich pól
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {headers.map((header) => (
                <div key={header} className="space-y-1">
                  <label className="text-sm font-medium">{header}</label>
                  <Select
                    value={columnMapping[header] || ""}
                    onChange={(e) =>
                      setColumnMapping((prev) => ({
                        ...prev,
                        [header]: e.target.value,
                      }))
                    }
                  >
                    {FIELD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {previewRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Podgląd (pierwsze {previewRows.length} wierszy)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((h) => (
                      <TableHead key={h}>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            {h}
                          </div>
                          {columnMapping[h] && (
                            <div className="text-xs text-primary font-medium">
                              →{" "}
                              {
                                FIELD_OPTIONS.find(
                                  (f) => f.value === columnMapping[h]
                                )?.label
                              }
                            </div>
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, i) => (
                    <TableRow key={i}>
                      {row.map((cell, j) => (
                        <TableCell key={j} className="text-sm">
                          {cell || "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Importuj dane
              </Button>
              <span className="text-sm text-muted-foreground">
                {csvData.length} wierszy do zaimportowania
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card
          className={
            result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
          }
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <p
                className={`text-sm font-medium ${result.success ? "text-green-700" : "text-red-700"}`}
              >
                {result.message}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

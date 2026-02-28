# Treatly ✨

CRM dla salonów beauty — rynek polski.

## Tech Stack

- **Next.js 14** (App Router)
- **Supabase** (Auth + PostgreSQL)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** components

## Uruchomienie

```bash
# 1. Zainstaluj zależności
npm install

# 2. Skopiuj zmienne środowiskowe
cp .env.local.example .env.local
# Uzupełnij wartości w .env.local

# 3. Uruchom bazę danych
# Wykonaj SQL z supabase/schema.sql w panelu Supabase

# 4. Uruchom serwer deweloperski
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000) w przeglądarce.

## Zmienne środowiskowe

| Zmienna | Opis |
|---------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL projektu Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Klucz anonimowy Supabase |
| `ANTHROPIC_API_KEY` | Klucz API Anthropic (do rekomendacji AI) |

## Struktura

```
src/
├── app/
│   ├── login/                    # Logowanie i rejestracja
│   ├── dashboard/                # Pulpit główny
│   │   ├── klienci/              # Lista klientów
│   │   │   ├── [id]/             # Profil klienta
│   │   │   └── nowy/             # Formularz nowego klienta
│   │   ├── wizyty/nowa/          # Nowa wizyta
│   │   ├── uslugi/               # Zarządzanie usługami
│   │   └── import/               # Import CSV
│   └── api/recommendations/      # API rekomendacji AI
├── components/ui/                # Komponenty UI (shadcn)
└── lib/                          # Helpery, typy, klient Supabase
supabase/
└── schema.sql                    # Schemat bazy danych
```

## Funkcjonalności

- Logowanie i rejestracja (Supabase Auth)
- Panel z podsumowaniem salonu
- Zarządzanie klientami (CRUD)
- Rejestracja wizyt
- Katalog usług
- Import danych z CSV z mapowaniem kolumn
- Rekomendacje AI (Claude) dla klientów
- Wykrywanie klientów zagrożonych odejściem (60+ dni bez wizyty)
- Row Level Security — każdy salon widzi tylko swoje dane

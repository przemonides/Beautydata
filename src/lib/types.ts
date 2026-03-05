export interface Salon {
  id: string;
  name: string;
  owner_email: string;
  created_at: string;
}

export interface Client {
  id: string;
  salon_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  birthdate: string | null;
  notes: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  salon_id: string;
  name: string;
  category: string | null;
  duration_minutes: number | null;
  price: number | null;
}

export interface Visit {
  id: string;
  salon_id: string;
  client_id: string;
  service_id: string | null;
  visit_date: string;
  price_paid: number | null;
  notes: string | null;
  created_at: string;
}

export interface VisitWithService extends Visit {
  services: Service | null;
}

export interface Recommendation {
  id: string;
  salon_id: string;
  client_id: string;
  recommendation_text: string | null;
  generated_at: string;
  is_read: boolean;
}

export interface RecommendationWithClient extends Recommendation {
  clients: Pick<Client, "first_name" | "last_name"> | null;
}

export interface ClientWithVisits extends Client {
  visits: { count: number }[];
  last_visit_date?: string | null;
}

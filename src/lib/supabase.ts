import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  address: string;
  vehicle_brand: string;
  vehicle_horsepower: number;
  created_at: string;
};

export type Avenant = {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  description: string;
  created_at: string;
};

export type TravelRecord = {
  id: string;
  avenant_id: string;
  travel_date: string;
  day_of_week: string;
  route: string[];
  total_km: number;
  is_punctual: boolean;
  monthly_occurrences: number;
  description: string;
  created_at: string;
};

export type RouteSegment = {
  id: string;
  travel_record_id: string;
  from_point: string;
  to_point: string;
  distance_km: number;
  sequence_order: number;
  created_at: string;
};

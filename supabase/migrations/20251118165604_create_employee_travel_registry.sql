/*
  # Registre de Déplacements des Employés
  
  1. Nouvelles Tables
    - `employees` - Informations des employés
      - `id` (uuid, clé primaire)
      - `first_name` (text) - Prénom
      - `last_name` (text) - Nom
      - `address` (text) - Adresse (point A)
      - `vehicle_brand` (text) - Marque du véhicule
      - `vehicle_horsepower` (integer) - Nombre de chevaux fiscaux
      - `created_at` (timestamptz)
      
    - `avenants` - Périodes de contrat/avenant
      - `id` (uuid, clé primaire)
      - `employee_id` (uuid, référence vers employees)
      - `period_start` (date) - Début de période
      - `period_end` (date) - Fin de période
      - `description` (text) - Description de l'avenant
      - `created_at` (timestamptz)
      
    - `travel_records` - Enregistrements de déplacements
      - `id` (uuid, clé primaire)
      - `avenant_id` (uuid, référence vers avenants)
      - `travel_date` (date) - Date du déplacement
      - `day_of_week` (text) - Jour de la semaine
      - `route` (jsonb) - Trame complète du déplacement [A, B, C, D, A]
      - `total_km` (decimal) - Total kilomètres parcourus
      - `created_at` (timestamptz)
      
    - `route_segments` - Segments individuels de trajet
      - `id` (uuid, clé primaire)
      - `travel_record_id` (uuid, référence vers travel_records)
      - `from_point` (text) - Point de départ
      - `to_point` (text) - Point d'arrivée
      - `distance_km` (decimal) - Distance en km
      - `sequence_order` (integer) - Ordre dans la séquence
      - `created_at` (timestamptz)
      
  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies pour permettre l'accès complet (application interne)
*/

-- Table des employés
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  address text NOT NULL,
  vehicle_brand text NOT NULL,
  vehicle_horsepower integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table des avenants (périodes contractuelles)
CREATE TABLE IF NOT EXISTS avenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Table des enregistrements de déplacements
CREATE TABLE IF NOT EXISTS travel_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avenant_id uuid NOT NULL REFERENCES avenants(id) ON DELETE CASCADE,
  travel_date date NOT NULL,
  day_of_week text NOT NULL,
  route jsonb DEFAULT '[]'::jsonb,
  total_km decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Table des segments de trajet
CREATE TABLE IF NOT EXISTS route_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_record_id uuid NOT NULL REFERENCES travel_records(id) ON DELETE CASCADE,
  from_point text NOT NULL,
  to_point text NOT NULL,
  distance_km decimal(10,2) NOT NULL,
  sequence_order integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_avenants_employee ON avenants(employee_id);
CREATE INDEX IF NOT EXISTS idx_travel_records_avenant ON travel_records(avenant_id);
CREATE INDEX IF NOT EXISTS idx_travel_records_date ON travel_records(travel_date);
CREATE INDEX IF NOT EXISTS idx_route_segments_travel ON route_segments(travel_record_id);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE avenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_segments ENABLE ROW LEVEL SECURITY;

-- Policies pour accès complet (application interne)
CREATE POLICY "Allow all operations on employees"
  ON employees FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on avenants"
  ON avenants FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on travel_records"
  ON travel_records FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on route_segments"
  ON route_segments FOR ALL
  USING (true)
  WITH CHECK (true);
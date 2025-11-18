/*
  # Ajout du type de déplacement (récurrent vs ponctuel)
  
  1. Modifications
    - Ajout de la colonne `is_punctual` dans `travel_records`
      - `is_punctual` (boolean) - Indique si c'est un déplacement ponctuel mensuel
      - Par défaut: false (déplacement récurrent hebdomadaire)
    
    - Ajout de la colonne `monthly_occurrences` dans `travel_records`
      - `monthly_occurrences` (integer) - Nombre de fois par mois (pour les ponctuels)
      - Par défaut: 1
  
  2. Logique de calcul
    - Déplacements récurrents (is_punctual = false): 
      Inclus dans le calcul de la moyenne hebdomadaire × 52 ÷ 12
    
    - Déplacements ponctuels (is_punctual = true):
      Ajoutés directement à la mensualité (km × monthly_occurrences)
*/

-- Ajout des colonnes pour gérer les déplacements ponctuels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_records' AND column_name = 'is_punctual'
  ) THEN
    ALTER TABLE travel_records ADD COLUMN is_punctual boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_records' AND column_name = 'monthly_occurrences'
  ) THEN
    ALTER TABLE travel_records ADD COLUMN monthly_occurrences integer DEFAULT 1;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_records' AND column_name = 'description'
  ) THEN
    ALTER TABLE travel_records ADD COLUMN description text DEFAULT '';
  END IF;
END $$;

-- Index pour filtrer les déplacements ponctuels
CREATE INDEX IF NOT EXISTS idx_travel_records_punctual ON travel_records(is_punctual);
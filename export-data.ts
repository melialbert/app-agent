import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportData() {
  try {
    console.log('📦 Export des données en cours...\n');

    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: true });

    if (empError) throw empError;

    const { data: avenants, error: aveError } = await supabase
      .from('avenants')
      .select('*')
      .order('created_at', { ascending: true });

    if (aveError) throw aveError;

    const { data: travelRecords, error: travelError } = await supabase
      .from('travel_records')
      .select('*')
      .order('created_at', { ascending: true });

    if (travelError) throw travelError;

    const { data: routeSegments, error: segError } = await supabase
      .from('route_segments')
      .select('*')
      .order('sequence_order', { ascending: true });

    if (segError) throw segError;

    const exportData = {
      exportDate: new Date().toISOString(),
      employees: employees || [],
      avenants: avenants || [],
      travel_records: travelRecords || [],
      route_segments: routeSegments || [],
    };

    const jsonData = JSON.stringify(exportData, null, 2);
    fs.writeFileSync('data-export.json', jsonData);

    console.log('✅ Export réussi!\n');
    console.log(`📊 Statistiques:`);
    console.log(`   - Employés: ${employees?.length || 0}`);
    console.log(`   - Avenants: ${avenants?.length || 0}`);
    console.log(`   - Déplacements: ${travelRecords?.length || 0}`);
    console.log(`   - Segments: ${routeSegments?.length || 0}`);
    console.log(`\n📄 Fichier créé: data-export.json\n`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error);
    process.exit(1);
  }
}

exportData();

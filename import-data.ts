import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function importData() {
  try {
    console.log('📦 Import des données en cours...\n');

    if (!fs.existsSync('data-export.json')) {
      console.error('❌ Fichier data-export.json introuvable!');
      process.exit(1);
    }

    const fileContent = fs.readFileSync('data-export.json', 'utf-8');
    const data = JSON.parse(fileContent);

    console.log('📊 Données à importer:');
    console.log(`   - Employés: ${data.employees.length}`);
    console.log(`   - Avenants: ${data.avenants.length}`);
    console.log(`   - Déplacements: ${data.travel_records.length}`);
    console.log(`   - Segments: ${data.route_segments.length}\n`);

    if (data.employees.length > 0) {
      console.log('📥 Import des employés...');
      const { error: empError } = await supabase
        .from('employees')
        .insert(data.employees);
      if (empError) throw empError;
      console.log('✅ Employés importés\n');
    }

    if (data.avenants.length > 0) {
      console.log('📥 Import des avenants...');
      const { error: aveError } = await supabase
        .from('avenants')
        .insert(data.avenants);
      if (aveError) throw aveError;
      console.log('✅ Avenants importés\n');
    }

    if (data.travel_records.length > 0) {
      console.log('📥 Import des déplacements...');
      const { error: travelError } = await supabase
        .from('travel_records')
        .insert(data.travel_records);
      if (travelError) throw travelError;
      console.log('✅ Déplacements importés\n');
    }

    if (data.route_segments.length > 0) {
      console.log('📥 Import des segments...');
      const { error: segError } = await supabase
        .from('route_segments')
        .insert(data.route_segments);
      if (segError) throw segError;
      console.log('✅ Segments importés\n');
    }

    console.log('🎉 Import terminé avec succès!\n');
  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    process.exit(1);
  }
}

importData();

import { useEffect, useState } from 'react';
import { supabase, type TravelRecord, type RouteSegment, type Avenant, type Employee } from '../lib/supabase';
import { Plus, Trash2, Calendar, TrendingUp, FileDown, Edit2 } from 'lucide-react';
import { TravelRecordForm } from './TravelRecordForm';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TravelRecordsViewProps {
  avenant: Avenant;
  employee: Employee;
}

interface TravelRecordWithSegments extends TravelRecord {
  segments: RouteSegment[];
}

export function TravelRecordsView({ avenant, employee }: TravelRecordsViewProps) {
  const [records, setRecords] = useState<TravelRecordWithSegments[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TravelRecordWithSegments | null>(null);

  useEffect(() => {
    loadRecords();
  }, [avenant.id]);

  async function loadRecords() {
    try {
      const { data: travelData, error: travelError } = await supabase
        .from('travel_records')
        .select('*')
        .eq('avenant_id', avenant.id)
        .order('travel_date', { ascending: true });

      if (travelError) throw travelError;

      const recordsWithSegments = await Promise.all(
        (travelData || []).map(async (record) => {
          const { data: segments, error: segError } = await supabase
            .from('route_segments')
            .select('*')
            .eq('travel_record_id', record.id)
            .order('sequence_order', { ascending: true });

          if (segError) throw segError;

          return {
            ...record,
            segments: segments || [],
          };
        })
      );

      setRecords(recordsWithSegments);
    } catch (error) {
      console.error('Error loading travel records:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteRecord(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce déplacement ?')) return;

    try {
      const { error } = await supabase
        .from('travel_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  }

  function calculateWeeklyStats() {
    const weeklyGroups: { [key: string]: TravelRecordWithSegments[] } = {};
    const recurringRecords = records.filter(r => !r.is_punctual);

    recurringRecords.forEach(record => {
      const date = new Date(record.travel_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyGroups[weekKey]) {
        weeklyGroups[weekKey] = [];
      }
      weeklyGroups[weekKey].push(record);
    });

    return Object.entries(weeklyGroups).map(([weekStart, weekRecords]) => {
      const totalKm = weekRecords.reduce((sum, r) => sum + r.total_km, 0);
      return {
        weekStart,
        records: weekRecords,
        totalKm,
        monthlyKm: (totalKm * 52) / 12,
      };
    });
  }

  function calculatePunctualStats() {
    const punctualRecords = records.filter(r => r.is_punctual);
    const totalPunctualKm = punctualRecords.reduce((sum, r) => sum + (r.total_km * r.monthly_occurrences), 0);
    return {
      records: punctualRecords,
      totalKm: totalPunctualKm,
    };
  }

  function exportToPDF() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text('Registre des Déplacements Professionnels', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(11);
    let yPos = 35;
    doc.text(`Employé: ${employee.first_name} ${employee.last_name}`, 14, yPos);
    yPos += 7;
    doc.text(`Adresse: ${employee.address}`, 14, yPos);
    yPos += 7;
    doc.text(`Véhicule: ${employee.vehicle_brand} (${employee.vehicle_horsepower} CV)`, 14, yPos);
    yPos += 7;
    doc.text(`Période: ${new Date(avenant.period_start).toLocaleDateString('fr-FR')} - ${new Date(avenant.period_end).toLocaleDateString('fr-FR')}`, 14, yPos);
    yPos += 10;

    if (punctualStats.records.length > 0) {
      doc.setFontSize(13);
      doc.setTextColor(184, 134, 11);
      doc.text('Déplacements Ponctuels Mensuels', 14, yPos);
      yPos += 5;

      const punctualData = punctualStats.records.map(record => [
        new Date(record.travel_date).toLocaleDateString('fr-FR'),
        record.day_of_week,
        (record.route as string[]).join(' → '),
        record.total_km.toFixed(2),
        record.monthly_occurrences.toString(),
        (record.total_km * record.monthly_occurrences).toFixed(2),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Jour', 'Parcours', 'KM', 'Fréq.', 'KM/mois']],
        body: punctualData,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [255, 237, 213], textColor: [120, 53, 15] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    if (recurringRecords.length > 0) {
      weeklyStats.forEach((week) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(13);
        doc.setTextColor(37, 99, 235);
        doc.text(`Semaine du ${new Date(week.weekStart).toLocaleDateString('fr-FR')}`, 14, yPos);
        yPos += 5;

        const weekData = week.records.map(record => [
          new Date(record.travel_date).toLocaleDateString('fr-FR'),
          record.day_of_week,
          (record.route as string[]).join(' → '),
          record.total_km.toFixed(2),
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Date', 'Jour', 'Parcours', 'Total KM']],
          body: weekData,
          theme: 'grid',
          styles: { fontSize: 9 },
          headStyles: { fillColor: [219, 234, 254], textColor: [30, 64, 175] },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      });
    }

    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    yPos += 5;
    doc.text('Résumé Mensuel', 14, yPos);
    yPos += 10;

    const summaryData = [
      ['Déplacements récurrents', `${recurringMonthlyKm.toFixed(2)} km/mois`],
      ['Déplacements ponctuels', `${punctualStats.totalKm.toFixed(2)} km/mois`],
      ['MENSUALISATION TOTALE', `${totalMonthlyKm.toFixed(2)} km/mois`],
    ];

    autoTable(doc, {
      startY: yPos,
      body: summaryData,
      theme: 'grid',
      styles: { fontSize: 11, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 80, halign: 'right' },
      },
    });

    const filename = `deplacements_${employee.last_name}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  }

  const weeklyStats = calculateWeeklyStats();
  const punctualStats = calculatePunctualStats();

  const recurringRecords = records.filter(r => !r.is_punctual);
  const totalRecurringKm = recurringRecords.reduce((sum, r) => sum + r.total_km, 0);
  const avgWeeklyKm = weeklyStats.length > 0 ? totalRecurringKm / weeklyStats.length : 0;
  const recurringMonthlyKm = (avgWeeklyKm * 52) / 12;
  const totalMonthlyKm = recurringMonthlyKm + punctualStats.totalKm;
  const totalKm = totalRecurringKm + punctualStats.records.reduce((sum, r) => sum + r.total_km, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {employee.first_name} {employee.last_name}
              </h3>
              <p className="text-sm text-gray-600">{employee.address}</p>
              <p className="text-sm text-gray-600">{employee.vehicle_brand} - {employee.vehicle_horsepower} CV</p>
              <p className="text-sm text-gray-600 mt-1">
                Période: {new Date(avenant.period_start).toLocaleDateString('fr-FR')} - {new Date(avenant.period_end).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                title="Exporter en PDF"
              >
                <FileDown className="w-4 h-4" />
                Exporter PDF
              </button>
              <button
                onClick={() => {
                  setEditingRecord(null);
                  setShowForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter un déplacement
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total période</p>
                <p className="text-2xl font-bold text-gray-900">{totalKm.toFixed(2)} km</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Moy. hebdo (récurrents)</p>
                <p className="text-2xl font-bold text-gray-900">{avgWeeklyKm.toFixed(2)} km</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mensualisation TOTALE</p>
                <p className="text-2xl font-bold text-green-600">{totalMonthlyKm.toFixed(2)} km</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg text-sm">
              <div>
                <p className="text-gray-600">Déplacements récurrents</p>
                <p className="text-lg font-semibold text-blue-600">{recurringMonthlyKm.toFixed(2)} km/mois</p>
                <p className="text-xs text-gray-500">(Moy. hebdo × 52 ÷ 12)</p>
              </div>
              <div>
                <p className="text-gray-600">Déplacements ponctuels</p>
                <p className="text-lg font-semibold text-amber-600">{punctualStats.totalKm.toFixed(2)} km/mois</p>
                <p className="text-xs text-gray-500">({punctualStats.records.length} déplacement{punctualStats.records.length > 1 ? 's' : ''})</p>
              </div>
            </div>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Aucun déplacement enregistré</p>
            <button
              onClick={() => {
                setEditingRecord(null);
                setShowForm(true);
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Ajouter le premier déplacement
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {punctualStats.records.length > 0 && (
              <div className="p-4 bg-amber-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-amber-900">
                    Déplacements ponctuels mensuels
                  </h4>
                  <div className="text-sm">
                    <span className="text-amber-700 font-semibold">
                      Total: {punctualStats.totalKm.toFixed(2)} km/mois
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {punctualStats.records.map(record => (
                    <div key={record.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-200">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-gray-900">
                            {new Date(record.travel_date).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="text-sm text-gray-600">{record.day_of_week}</span>
                          {record.description && (
                            <span className="text-sm text-amber-700 font-medium">
                              {record.description}
                            </span>
                          )}
                          <span className="ml-auto font-semibold text-amber-600">
                            {record.total_km.toFixed(2)} km × {record.monthly_occurrences} = {(record.total_km * record.monthly_occurrences).toFixed(2)} km/mois
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                          <span className="font-medium">Parcours:</span>
                          <span>{(record.route as string[]).join(' → ')}</span>
                        </div>

                        <div className="space-y-1">
                          {record.segments.map(segment => (
                            <div key={segment.id} className="flex items-center gap-2 text-xs text-gray-600">
                              <span className="w-15 text-center font-medium">{segment.from_point}</span>
                              <span> → </span>
                              <span className="w-15 text-center font-medium">{segment.to_point}</span>
                              <span className="ml-2 text-gray-500">{segment.distance_km.toFixed(2)} km</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingRecord(record);
                            setShowForm(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteRecord(record.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {weeklyStats.map(({ weekStart, records: weekRecords, totalKm: weekKm, monthlyKm: weekMonthly }) => (
              <div key={weekStart} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">
                    Semaine du {new Date(weekStart).toLocaleDateString('fr-FR')}
                  </h4>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      Total: <span className="font-semibold text-gray-900">{weekKm.toFixed(2)} km</span>
                    </span>
                    <span className="text-green-600 font-semibold flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {weekMonthly.toFixed(2)} km/mois
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {weekRecords.map(record => (
                    <div key={record.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-gray-900">
                            {new Date(record.travel_date).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="text-sm text-gray-600">{record.day_of_week}</span>
                          <span className="ml-auto font-semibold text-blue-600">
                            {record.total_km.toFixed(2)} km
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                          <span className="font-medium">Parcours:</span>
                          <span>{(record.route as string[]).join(' → ')}</span>
                        </div>

                        <div className="space-y-1">
                          {record.segments.map(segment => (
                            <div key={segment.id} className="flex items-center gap-2 text-xs text-gray-600">
                              <span className="w-15 text-center font-medium">{segment.from_point}</span>
                              <span>→</span>
                              <span className="w-15 text-center font-medium">{segment.to_point}</span>
                              <span className="ml-2 text-gray-500">{segment.distance_km.toFixed(2)} km</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingRecord(record);
                            setShowForm(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteRecord(record.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <TravelRecordForm
          avenantId={avenant.id}
          record={editingRecord}
          onClose={() => {
            setShowForm(false);
            setEditingRecord(null);
          }}
          onSaved={loadRecords}
        />
      )}
    </div>
  );
}

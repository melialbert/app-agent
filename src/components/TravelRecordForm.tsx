import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Save, X } from 'lucide-react';

interface RouteSegmentInput {
  from: string;
  to: string;
  km: number;
}

interface TravelRecordFormProps {
  avenantId: string;
  onClose: () => void;
  onSaved: () => void;
}

const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export function TravelRecordForm({ avenantId, onClose, onSaved }: TravelRecordFormProps) {
  const [travelDate, setTravelDate] = useState('');
  const [segments, setSegments] = useState<RouteSegmentInput[]>([
    { from: 'A', to: 'B', km: 0 },
  ]);
  const [isPunctual, setIsPunctual] = useState(false);
  const [monthlyOccurrences, setMonthlyOccurrences] = useState(1);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  function addSegment() {
    const lastSegment = segments[segments.length - 1];
    setSegments([...segments, { from: lastSegment.to, to: '', km: 0 }]);
  }

  function removeSegment(index: number) {
    setSegments(segments.filter((_, i) => i !== index));
  }

  function updateSegment(index: number, field: keyof RouteSegmentInput, value: string | number) {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    setSegments(newSegments);
  }

  function getTotalKm() {
    return segments.reduce((sum, seg) => sum + (seg.km || 0), 0);
  }

  function getDayOfWeek(dateString: string) {
    const date = new Date(dateString);
    return DAYS_OF_WEEK[date.getDay() === 0 ? 6 : date.getDay() - 1];
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const route = segments.map(s => s.from);
      route.push(segments[segments.length - 1].to);

      const { data: travelRecord, error: travelError } = await supabase
        .from('travel_records')
        .insert([{
          avenant_id: avenantId,
          travel_date: travelDate,
          day_of_week: getDayOfWeek(travelDate),
          route: route,
          total_km: getTotalKm(),
          is_punctual: isPunctual,
          monthly_occurrences: isPunctual ? monthlyOccurrences : 0,
          description: description,
        }])
        .select()
        .single();

      if (travelError) throw travelError;

      const segmentsToInsert = segments.map((seg, index) => ({
        travel_record_id: travelRecord.id,
        from_point: seg.from,
        to_point: seg.to,
        distance_km: seg.km,
        sequence_order: index,
      }));

      const { error: segmentsError } = await supabase
        .from('route_segments')
        .insert(segmentsToInsert);

      if (segmentsError) throw segmentsError;

      onSaved();
      onClose();
    } catch (error) {
      console.error('Error saving travel record:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Nouveau déplacement</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date du déplacement
            </label>
            <input
              type="date"
              required
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {travelDate && (
              <p className="text-sm text-gray-600 mt-1">{getDayOfWeek(travelDate)}</p>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPunctual"
                checked={isPunctual}
                onChange={(e) => setIsPunctual(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="isPunctual" className="text-sm font-medium text-gray-700">
                Déplacement ponctuel (heures journalières mensuelles)
              </label>
            </div>

            {isPunctual && (
              <div className="pl-6 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de fois par mois
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={monthlyOccurrences}
                    onChange={(e) => setMonthlyOccurrences(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ex: 2ème mercredi du mois = 1 fois par mois
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: 2ème mercredi - Basic Fit"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    Les km de ce déplacement ({getTotalKm().toFixed(2)} km × {monthlyOccurrences}) seront ajoutés directement à la mensualité
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Trame du déplacement
              </label>
              <button
                type="button"
                onClick={addSegment}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter un segment
              </button>
            </div>

            <div className="space-y-3">
              {segments.map((segment, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    required
                    value={segment.from}
                    onChange={(e) => updateSegment(index, 'from', e.target.value)}
                    placeholder="De"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-medium"
                  />
                  <span className="text-gray-400">→</span>
                  <input
                    type="text"
                    required
                    value={segment.to}
                    onChange={(e) => updateSegment(index, 'to', e.target.value)}
                    placeholder="Vers"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-medium"
                  />
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.1"
                    value={segment.km || ''}
                    onChange={(e) => updateSegment(index, 'km', parseFloat(e.target.value) || 0)}
                    placeholder="km"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-600">km</span>
                  {segments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSegment(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                Total: {getTotalKm().toFixed(2)} km
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Parcours: {segments.map(s => s.from).join(' → ')} → {segments[segments.length - 1]?.to}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useEffect, useState, FormEvent } from 'react';
import { supabase, type Avenant, type Employee } from '../lib/supabase';
import { Calendar, Plus, X, Save } from 'lucide-react';

interface AvenantManagerProps {
  employee: Employee;
  onSelectAvenant: (avenant: Avenant | null) => void;
  selectedAvenantId: string | null;
}

export function AvenantManager({ employee, onSelectAvenant, selectedAvenantId }: AvenantManagerProps) {
  const [avenants, setAvenants] = useState<Avenant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    period_start: '',
    period_end: '',
    description: '',
  });

  useEffect(() => {
    loadAvenants();
  }, [employee.id]);

  async function loadAvenants() {
    try {
      const { data, error } = await supabase
        .from('avenants')
        .select('*')
        .eq('employee_id', employee.id)
        .order('period_start', { ascending: false });

      if (error) throw error;
      setAvenants(data || []);
    } catch (error) {
      console.error('Error loading avenants:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('avenants')
        .insert([{ ...formData, employee_id: employee.id }]);

      if (error) throw error;

      setFormData({ period_start: '', period_end: '', description: '' });
      setShowForm(false);
      loadAvenants();
    } catch (error) {
      console.error('Error saving avenant:', error);
      alert('Erreur lors de la sauvegarde');
    }
  }

  async function deleteAvenant(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet avenant et tous ses déplacements ?')) return;

    try {
      const { error } = await supabase
        .from('avenants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadAvenants();
      if (selectedAvenantId === id) {
        onSelectAvenant(null);
      }
    } catch (error) {
      console.error('Error deleting avenant:', error);
    }
  }

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
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Avenants / Périodes</h3>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvel avenant
        </button>
      </div>

      <div className="divide-y divide-gray-200">
        {avenants.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p className="text-sm">Aucun avenant enregistré</p>
          </div>
        ) : (
          avenants.map((avenant) => (
            <div
              key={avenant.id}
              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                selectedAvenantId === avenant.id ? 'bg-green-50 border-l-4 border-green-600' : ''
              }`}
              onClick={() => onSelectAvenant(avenant)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(avenant.period_start).toLocaleDateString('fr-FR')} - {avenant.period_end ? new Date(avenant.period_end).toLocaleDateString('fr-FR') : 'En cours'}
                  </p>
                  {avenant.description && (
                    <p className="text-sm text-gray-600 mt-1">{avenant.description}</p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAvenant(avenant.id);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Nouvel avenant</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  required
                  value={formData.period_start}
                  onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin (optionnel)
                </label>
                <input
                  type="date"
                  value={formData.period_end}
                  onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optionnel)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Ex: Avenant au contrat de travail..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase, type Avenant, type Employee } from '../lib/supabase';
import { Calendar, Filter } from 'lucide-react';

interface AvenantWithEmployee extends Avenant {
  employee: Employee;
}

interface AllAvenantsViewProps {
  onSelectAvenant?: (avenant: Avenant, employee: Employee) => void;
}

export function AllAvenantsView({ onSelectAvenant }: AllAvenantsViewProps) {
  const [avenants, setAvenants] = useState<AvenantWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAvenants();
  }, [selectedYear, selectedEmployeeId]);

  async function loadData() {
    try {
      const [avenantsResponse, employeesResponse] = await Promise.all([
        supabase
          .from('avenants')
          .select('*, employee:employees(*)')
          .order('period_start', { ascending: false }),
        supabase
          .from('employees')
          .select('*')
          .order('last_name', { ascending: true })
      ]);

      if (avenantsResponse.error) throw avenantsResponse.error;
      if (employeesResponse.error) throw employeesResponse.error;

      const avenantsData = (avenantsResponse.data || []).map(a => ({
        ...a,
        employee: Array.isArray(a.employee) ? a.employee[0] : a.employee
      }));

      setAvenants(avenantsData);
      setEmployees(employeesResponse.data || []);

      const years = Array.from(
        new Set(
          avenantsData.map(a => new Date(a.period_start).getFullYear())
        )
      ).sort((a, b) => b - a);

      setAvailableYears(years);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterAvenants() {
    return avenants.filter(avenant => {
      const yearMatch = selectedYear === 'all' ||
        new Date(avenant.period_start).getFullYear().toString() === selectedYear;

      const employeeMatch = selectedEmployeeId === 'all' ||
        avenant.employee_id === selectedEmployeeId;

      return yearMatch && employeeMatch;
    });
  }

  const filteredAvenants = filterAvenants();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Tous les Avenants</h2>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="w-4 h-4 inline mr-1" />
              Année
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les années</option>
              {availableYears.map(year => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="w-4 h-4 inline mr-1" />
              Employé
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les employés</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          {filteredAvenants.length} avenant{filteredAvenants.length > 1 ? 's' : ''} trouvé{filteredAvenants.length > 1 ? 's' : ''}
        </div>
      </div>

      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {filteredAvenants.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p className="text-sm">Aucun avenant trouvé avec ces filtres</p>
          </div>
        ) : (
          filteredAvenants.map((avenant) => (
            <div
              key={avenant.id}
              className="p-4 hover:bg-blue-50 transition-colors cursor-pointer border-l-4 border-transparent hover:border-blue-500"
              onClick={() => onSelectAvenant?.(avenant, avenant.employee)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-gray-900">
                      {avenant.employee.first_name} {avenant.employee.last_name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {avenant.employee.vehicle_brand} ({avenant.employee.vehicle_horsepower} CV)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">
                      {new Date(avenant.period_start).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                    <span>→</span>
                    <span className="font-medium">
                      {avenant.period_end
                        ? new Date(avenant.period_end).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                        : 'En cours'
                      }
                    </span>
                  </div>

                  {avenant.description && (
                    <p className="text-sm text-gray-600 mt-2 italic">
                      {avenant.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

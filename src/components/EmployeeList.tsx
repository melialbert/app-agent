import { useEffect, useState } from 'react';
import { supabase, type Employee } from '../lib/supabase';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';

interface EmployeeListProps {
  onSelectEmployee: (employee: Employee | null) => void;
  onAddEmployee: () => void;
  selectedEmployeeId: string | null;
}

export function EmployeeList({ onSelectEmployee, onAddEmployee, selectedEmployeeId }: EmployeeListProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteEmployee(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) return;

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadEmployees();
      if (selectedEmployeeId === id) {
        onSelectEmployee(null);
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  }

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
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Employés</h2>
        </div>
        <button
          onClick={onAddEmployee}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      <div className="divide-y divide-gray-200">
        {employees.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Aucun employé enregistré</p>
            <button
              onClick={onAddEmployee}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Ajouter le premier employé
            </button>
          </div>
        ) : (
          employees.map((employee) => (
            <div
              key={employee.id}
              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                selectedEmployeeId === employee.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
              }`}
              onClick={() => onSelectEmployee(employee)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    {employee.first_name} {employee.last_name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{employee.address}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>{employee.vehicle_brand}</span>
                    <span>{employee.vehicle_horsepower} CV</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteEmployee(employee.id);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

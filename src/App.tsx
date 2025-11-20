import { useState } from 'react';
import { Car, List } from 'lucide-react';
import { EmployeeList } from './components/EmployeeList';
import { EmployeeForm } from './components/EmployeeForm';
import { AvenantManager } from './components/AvenantManager';
import { TravelRecordsView } from './components/TravelRecordsView';
import { AllAvenantsView } from './components/AllAvenantsView';
import type { Employee, Avenant } from './lib/supabase';

function App() {
  const [view, setView] = useState<'employees' | 'all-avenants'>('employees');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedAvenant, setSelectedAvenant] = useState<Avenant | null>(null);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleEmployeeSaved() {
    setRefreshKey(prev => prev + 1);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/logo.svg"
                alt="Dymatic Employee Mileage"
                className="h-16 w-16"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Dymatic Employee Mileage
                </h1>
                <p className="text-sm text-gray-600">
                  Suivi des déplacements professionnels en véhicule personnel
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setView('employees');
                  setSelectedEmployee(null);
                  setSelectedAvenant(null);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'employees'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Par Employé
              </button>
              <button
                onClick={() => setView('all-avenants')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'all-avenants'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <List className="w-4 h-4" />
                Tous les Avenants
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {view === 'all-avenants' ? (
          selectedAvenant && selectedEmployee ? (
            <div>
              <div className="mb-4">
                <button
                  onClick={() => {
                    setSelectedAvenant(null);
                    setSelectedEmployee(null);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Retour à tous les avenants
                </button>
              </div>
              <TravelRecordsView
                avenant={selectedAvenant}
                employee={selectedEmployee}
              />
            </div>
          ) : (
            <AllAvenantsView
              onSelectAvenant={(avenant, employee) => {
                setSelectedAvenant(avenant);
                setSelectedEmployee(employee);
              }}
            />
          )
        ) : (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-3">
              <EmployeeList
                key={refreshKey}
                onSelectEmployee={(emp) => {
                  setSelectedEmployee(emp);
                  setSelectedAvenant(null);
                }}
                onAddEmployee={() => {
                  setEditingEmployee(null);
                  setShowEmployeeForm(true);
                }}
                onEditEmployee={(emp) => {
                  setEditingEmployee(emp);
                  setShowEmployeeForm(true);
                }}
                selectedEmployeeId={selectedEmployee?.id || null}
              />
            </div>

            <div className="col-span-9">
              {!selectedEmployee ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <Car className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Bienvenue dans le Registre de Déplacements
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Sélectionnez un employé dans la liste de gauche pour commencer,
                    ou ajoutez un nouvel employé.
                  </p>
                </div>
              ) : !selectedAvenant ? (
                <AvenantManager
                  employee={selectedEmployee}
                  onSelectAvenant={setSelectedAvenant}
                  selectedAvenantId={null}
                />
              ) : (
                <TravelRecordsView
                  avenant={selectedAvenant}
                  employee={selectedEmployee}
                />
              )}

              {selectedEmployee && selectedAvenant && (
                <div className="mt-4">
                  <button
                    onClick={() => setSelectedAvenant(null)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    ← Retour aux avenants
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showEmployeeForm && (
        <EmployeeForm
          employee={editingEmployee}
          onClose={() => {
            setShowEmployeeForm(false);
            setEditingEmployee(null);
          }}
          onSaved={handleEmployeeSaved}
        />
      )}
    </div>
  );
}

export default App;

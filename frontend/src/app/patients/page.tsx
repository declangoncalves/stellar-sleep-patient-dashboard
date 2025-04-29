// frontend/app/page.tsx (Next 13+ with app router)

'use client';
import { useEffect, useState } from 'react';
import { Patient } from '@/lib/types';
import { Modal } from '@/components/Modal/Modal';
import { PatientInfo } from './PatientInfo/PatientInfo';
import { Searchbar } from '@/components/Searchbar/Searchbar';
import { PatientTable } from './PatientTable/PatientTable';
import { Navbar } from '@/components/Navbar/Navbar';
import { Button } from '@/components/Button/Button';
import { useFilters } from './hooks/useFilters';
import { patientsApi } from '@/lib/api';
import { FiltersPanel } from '../../components/FiltersPanel/FiltersPanel';

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState('last_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const {
    filters,
    debouncedFilters,
    setStatus,
    setCity,
    setState,
    setSearch,
    clearAll,
  } = useFilters();

  // Fetch data when filters, search, or page changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        const { patients, totalPages } = await patientsApi.fetchPatients({
          page: currentPage,
          status: debouncedFilters.status,
          city: debouncedFilters.city,
          state: debouncedFilters.state,
          search: debouncedFilters.search,
          ordering: `${sortDirection === 'desc' ? '-' : ''}${sortColumn}`,
        });

        setPatients(patients);
        setTotalPages(totalPages);
      } catch (err) {
        console.error('Error fetching patients:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [debouncedFilters, currentPage, sortColumn, sortDirection]);

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setCurrentPage(1);
  };

  const handleCityChange = (value: string) => {
    setCity(value);
    setCurrentPage(1);
  };

  const handleStateChange = (value: string) => {
    setState(value);
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    clearAll();
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearch(query);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddPatient = () => {
    setIsCreateMode(true);
    const tempId = -Date.now();
    setSelectedPatient({
      id: tempId,
      first_name: '',
      last_name: '',
      middle_name: '',
      date_of_birth: '',
      status: 'inquiry',
      last_visit: null,
      addresses: [],
      ready_to_discharge: false,
      isi_scores: [],
      custom_field_values: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  };

  const handlePatientSaved = (updatedPatient: Patient) => {
    if (isCreateMode) {
      setPatients(prevPatients =>
        prevPatients
          .filter(p => p.id !== updatedPatient.id)
          .concat(updatedPatient),
      );
    } else {
      setPatients(
        patients.map(p => (p.id === updatedPatient.id ? updatedPatient : p)),
      );
    }
    setSelectedPatient(null);
    setIsCreateMode(false);
  };

  const fieldMap: Record<string, string> = {
    name: 'last_name',
    status: 'status',
    location: 'addresses__city',
    age: 'date_of_birth',
    last_visit: 'last_visit',
    isi_score: 'isi_scores__score',
  };

  const handleSort = (column: string) => {
    const dbField = fieldMap[column];
    if (sortColumn === dbField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(dbField);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    filters.status || filters.city || filters.state,
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar className="fixed top-0 left-0 right-0 z-10" />
      <main className="flex-1 flex flex-col mt-[calc(var(--navbar-height)+1rem)] px-16 py-2 pt-8 overflow-hidden">
        <div className="flex justify-between items-center mb-12 pb-4 border-b border-gray-200">
          <h1 className="text-4xl text-black">Patients</h1>
          <div className="flex items-center gap-4">
            <div className="w-[28rem]">
              <Searchbar
                value={filters.search}
                onChange={handleSearchChange}
                placeholder="Search patients by name..."
              />
            </div>
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              >
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {[
                      filters.status ? 1 : 0,
                      filters.city ? 1 : 0,
                      filters.state ? 1 : 0,
                    ].reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </Button>
              <FiltersPanel
                isOpen={isFiltersOpen}
                statusValue={filters.status}
                onStatusChange={handleStatusChange}
                cityValue={filters.city}
                onCityChange={handleCityChange}
                stateValue={filters.state}
                onStateChange={handleStateChange}
                onClearAll={handleClearAllFilters}
                hasActiveFilters={hasActiveFilters}
                onClose={() => setIsFiltersOpen(false)}
              />
            </div>
            <Button variant="primary" onClick={handleAddPatient}>
              Add Patient
            </Button>
          </div>
        </div>

        <div className="flex-1 flex bg-white rounded-lg overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <PatientTable
                patients={patients}
                onPatientClick={setSelectedPatient}
                isLoading={isLoading}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </div>
            <div className="flex items-center justify-center py-6 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || patients.length === 0}
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'primary' : 'outline'}
                        onClick={() => handlePageChange(page)}
                        disabled={patients.length === 0}
                      >
                        {page}
                      </Button>
                    ),
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || patients.length === 0}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {selectedPatient && (
        <Modal
          title="Patient Info"
          onClose={() => {
            setSelectedPatient(null);
            setIsCreateMode(false);
          }}
        >
          <PatientInfo
            patient={selectedPatient}
            onSaved={handlePatientSaved}
            onClose={() => {
              setSelectedPatient(null);
              setIsCreateMode(false);
            }}
            isCreateMode={isCreateMode}
          />
        </Modal>
      )}
    </div>
  );
}

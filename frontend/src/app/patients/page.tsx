// frontend/app/page.tsx (Next 13+ with app router)

'use client';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import type { Patient } from '@/lib/types';
import { Modal } from '@/components/Modal/Modal';
import { PatientInfo } from '@/components/PatientInfo/PatientInfo';
import { Searchbar } from '@/components/Searchbar/Searchbar';
import { PatientTable } from '@/components/PatientTable/PatientTable';
import { Navbar } from '@/components/Navbar/Navbar';
import { Button } from '@/components/Button/Button';

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Patient[];
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [debouncedCityFilter, setDebouncedCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [debouncedStateFilter, setDebouncedStateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const filtersRef = useRef<HTMLDivElement>(null);

  // Handle click outside of filters panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filtersRef.current &&
        !filtersRef.current.contains(event.target as Node)
      ) {
        setIsFiltersOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 600);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Debounce city filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCityFilter(cityFilter);
    }, 600);

    return () => clearTimeout(timer);
  }, [cityFilter]);

  // Debounce state filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStateFilter(stateFilter);
    }, 600);

    return () => clearTimeout(timer);
  }, [stateFilter]);

  // Fetch data when filters, search, or page changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          ...(statusFilter && { status: statusFilter }),
          ...(debouncedCityFilter && { city: debouncedCityFilter }),
          ...(debouncedStateFilter && { state: debouncedStateFilter }),
          ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
          ordering: `${sortDirection === 'desc' ? '-' : ''}${sortColumn}`,
        });

        const response = await axios.get<PaginatedResponse>(
          `http://127.0.0.1:8000/api/patients/?${params}`,
        );

        setPatients(response.data.results);
        setTotalPages(Math.ceil(response.data.count / 10));
      } catch (err) {
        console.error('Error fetching patients:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [
    statusFilter,
    debouncedCityFilter,
    debouncedStateFilter,
    debouncedSearchQuery,
    currentPage,
    sortColumn,
    sortDirection,
  ]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleCityChange = (value: string) => {
    setCityFilter(value);
    setCurrentPage(1);
  };

  const handleStateChange = (value: string) => {
    setStateFilter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddPatient = () => {
    setIsCreateMode(true);
    setSelectedPatient({
      id: 0,
      first_name: '',
      last_name: '',
      date_of_birth: '',
      status: 'inquiry',
      last_visit: null,
      addresses: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  };

  const handlePatientSaved = (updatedPatient: Patient) => {
    if (isCreateMode) {
      setPatients([updatedPatient, ...patients]);
    } else {
      setPatients(
        patients.map(p => (p.id === updatedPatient.id ? updatedPatient : p)),
      );
    }
    setSelectedPatient(null);
    setIsCreateMode(false);
  };

  const handleSort = (column: string) => {
    // Map frontend column names to database field names
    const fieldMap: Record<string, string> = {
      name: 'last_name',
      status: 'status',
      location: 'addresses__city',
      age: 'date_of_birth',
      last_visit: 'last_visit',
    };

    const dbField = fieldMap[column];
    if (sortColumn === dbField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(dbField);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar className="fixed top-0 left-0 right-0 z-10" />
      <main className="flex-1 flex flex-col mt-[calc(var(--navbar-height)+1rem)] px-16 py-2 pt-8 overflow-hidden">
        <div className="flex justify-between items-center mb-12 pb-4 border-b border-gray-200">
          <h1 className="text-4xl text-black">Patients</h1>
          <div className="flex items-center gap-4">
            <div className="w-[28rem]">
              <Searchbar
                value={searchQuery}
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
              </Button>
              {isFiltersOpen && (
                <div
                  ref={filtersRef}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-lg border border-gray-200 shadow-lg z-50"
                >
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={statusFilter}
                        onChange={e => handleStatusChange(e.target.value)}
                        className="w-full p-2 border rounded text-black"
                      >
                        <option value="">All Statuses</option>
                        <option value="inquiry">Inquiry</option>
                        <option value="onboarding">Onboarding</option>
                        <option value="active">Active</option>
                        <option value="churned">Churned</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={cityFilter}
                        onChange={e => handleCityChange(e.target.value)}
                        placeholder="Filter by city"
                        className="w-full p-2 border rounded text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={stateFilter}
                        onChange={e => handleStateChange(e.target.value)}
                        placeholder="Filter by state"
                        className="w-full p-2 border rounded text-black"
                      />
                    </div>
                  </div>
                </div>
              )}
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
            {/* Pagination Controls */}
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

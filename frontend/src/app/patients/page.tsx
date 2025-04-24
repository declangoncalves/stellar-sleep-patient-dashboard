// frontend/app/page.tsx (Next 13+ with app router)

'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import type { Patient } from '@/lib/types';
import { PatientListCard } from '@/components/PatientListCard/PatientListCard';
import { Modal } from '@/components/Modal/Modal';
import { PatientInfo } from '@/components/PatientInfo/PatientInfo';
import { Searchbar } from '@/components/Searchbar/Searchbar';

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Patient[];
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPatientRef = useCallback(
    (node: HTMLLIElement | null) => {
      if (isLoadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          loadMorePatients();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoadingMore, hasMore],
  );

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 600);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch initial data when filters or search change
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setPatients([]); // Clear existing patients before new fetch
      setHasMore(true);

      try {
        const params = new URLSearchParams({
          page: '1',
          ...(statusFilter && { status: statusFilter }),
          ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
        });

        const response = await axios.get<PaginatedResponse>(
          `http://127.0.0.1:8000/api/patients/?${params}`,
        );

        setPatients(response.data.results);
        setHasMore(response.data.next !== null);
      } catch (err) {
        console.error('Error fetching patients:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [statusFilter, debouncedSearchQuery]);

  const loadMorePatients = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = Math.ceil(patients.length / 10) + 1;
      const params = new URLSearchParams({
        page: nextPage.toString(),
        ...(statusFilter && { status: statusFilter }),
        ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
      });

      const response = await axios.get<PaginatedResponse>(
        `http://127.0.0.1:8000/api/patients/?${params}`,
      );

      setPatients(prev => [...prev, ...response.data.results]);
      setHasMore(response.data.next !== null);
    } catch (err) {
      console.error('Error loading more patients:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <main className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl text-black font-bold">Patients</h1>
        <div className="w-1/3">
          <Searchbar
            placeholder="Search patients by name..."
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={handleStatusChange}
            className="w-full p-2 border rounded-md"
          >
            <option value="">All Statuses</option>
            <option value="inquiry">Inquiry</option>
            <option value="onboarding">Onboarding</option>
            <option value="active">Active</option>
            <option value="churned">Churned</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {patients.map((patient, index) => (
              <li
                key={patient.id}
                ref={index === patients.length - 1 ? lastPatientRef : null}
                className="text-black"
                onClick={() => setSelectedPatient(patient)}
              >
                <PatientListCard patient={patient} />
              </li>
            ))}
          </ul>

          {isLoadingMore && (
            <div className="flex justify-center items-center my-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
        </>
      )}

      {selectedPatient && (
        <Modal onClose={() => setSelectedPatient(null)}>
          <PatientInfo
            patient={selectedPatient}
            onSaved={updated => {
              console.log('updated', updated);
              /* update your state */
            }}
            onClose={() => setSelectedPatient(null)}
          />
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => setSelectedPatient(null)}
          >
            Close
          </button>
        </Modal>
      )}
    </main>
  );
}

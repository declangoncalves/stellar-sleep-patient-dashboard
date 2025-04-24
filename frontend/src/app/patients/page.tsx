// frontend/app/page.tsx (Next 13+ with app router)

'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import type { Patient } from '@/lib/types';
import { PatientListCard } from '@/components/PatientListCard/PatientListCard';
import { Modal } from '@/components/Modal/Modal';
import { PatientInfo } from '@/components/PatientInfo/PatientInfo';
import { Searchbar } from '@/components/Searchbar/Searchbar';

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    axios
      .get('http://127.0.0.1:8000/api/patients/')
      .then(res => setPatients(res.data))
      .catch(err => console.error(err));
  }, []);

  const filteredPatients = patients.filter(patient => {
    // Apply status filter
    if (statusFilter && patient.status !== statusFilter) {
      return false;
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const fullName =
        `${patient.first_name} ${patient.middle_name || ''} ${patient.last_name}`.toLowerCase();
      return fullName.includes(query);
    }

    return true;
  });

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
            className="w-full p-2 border rounded-md text-black"
          >
            <option value="">All Statuses</option>
            <option value="inquiry">Inquiry</option>
            <option value="onboarding">Onboarding</option>
            <option value="active">Active</option>
            <option value="churned">Churned</option>
          </select>
        </div>
      </div>

      <ul className="space-y-2">
        {filteredPatients.map(patient => (
          <li
            key={patient.id}
            className="text-black"
            onClick={() => setSelectedPatient(patient)}
          >
            <PatientListCard patient={patient} />
          </li>
        ))}
      </ul>
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
          {/* Add more details or even a form here */}
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

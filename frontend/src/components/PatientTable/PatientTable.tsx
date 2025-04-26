'use client';

import { useEffect, useRef, useState } from 'react';
import type { Patient } from '@/lib/types';
import Image from 'next/image';

interface PatientTableProps {
  patients: Patient[];
  onPatientClick: (patient: Patient) => void;
  isLoading: boolean;
}

export function PatientTable({
  patients,
  onPatientClick,
  isLoading,
}: PatientTableProps) {
  const tableRef = useRef<HTMLTableElement>(null);
  const [rowHeight, setRowHeight] = useState<number>(0);

  useEffect(() => {
    if (tableRef.current) {
      const tableHeight = tableRef.current.clientHeight;
      const calculatedRowHeight = tableHeight / 11; // Divide by 11 for slightly smaller rows
      setRowHeight(calculatedRowHeight);
    }
  }, [tableRef.current]);

  const getPatientName = (patient: Patient) => {
    const middleInitial = patient.middle_name
      ? ` ${patient.middle_name.charAt(0)}.`
      : '';
    return `${patient.first_name}${middleInitial} ${patient.last_name}`;
  };

  const getPrimaryAddress = (patient: Patient) => {
    return patient.addresses?.[0] || null;
  };

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  return (
    <div className="w-full h-full overflow-auto">
      <table ref={tableRef} className="w-full border-collapse">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="p-4 text-left text-sm font-medium text-gray-500">
              Name
            </th>
            <th className="p-4 text-left text-sm font-medium text-gray-500">
              Status
            </th>
            <th className="p-4 text-left text-sm font-medium text-gray-500">
              Location
            </th>
            <th className="p-4 text-left text-sm font-medium text-gray-500">
              Age
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-500">
                Loading...
              </td>
            </tr>
          ) : patients.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-500">
                No patients found
              </td>
            </tr>
          ) : (
            patients.map(patient => (
              <tr
                key={patient.id}
                onClick={() => onPatientClick(patient)}
                className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                style={{ height: rowHeight }}
              >
                <td className="p-4 text-sm text-gray-900">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-300">
                      <Image
                        src="/icons/stellar-sleep.png"
                        alt={getPatientName(patient)}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-medium">
                      {getPatientName(patient)}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-900">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      patient.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : patient.status === 'inquiry'
                          ? 'bg-blue-100 text-blue-800'
                          : patient.status === 'onboarding'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {patient.status.charAt(0).toUpperCase() +
                      patient.status.slice(1)}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-900">
                  {getPrimaryAddress(patient)
                    ? `${getPrimaryAddress(patient)?.city}, ${getPrimaryAddress(patient)?.state}`
                    : '-'}
                </td>
                <td className="p-4 text-sm text-gray-900">
                  {calculateAge(patient.date_of_birth)} years
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

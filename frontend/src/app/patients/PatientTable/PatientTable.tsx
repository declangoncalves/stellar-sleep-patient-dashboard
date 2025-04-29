'use client';

import type { ISIScore, Patient } from '@/lib/types';
import Image from 'next/image';
import clsx from 'clsx';
import { useState } from 'react';

// Types
interface PatientTableProps {
  patients: Patient[];
  onPatientClick: (patient: Patient) => void;
  isLoading: boolean;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
}

type ColumnConfig = {
  key: string;
  header: string;
  width: string;
  sortable?: boolean;
  render: (patient: Patient) => React.ReactNode;
};

// Utility functions
const getPatientName = (patient: Patient) => {
  const middleInitial = patient.middle_name
    ? ` ${patient.middle_name.charAt(0)}.`
    : '';
  return `${patient.first_name}${middleInitial} ${patient.last_name}`;
};

const getPrimaryAddress = (patient: Patient) => patient.addresses?.[0] || null;

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

const getLatestISIScore = (scores: ISIScore[]) => {
  if (!scores || scores.length === 0) return null;
  return scores[0]; // First score is already the most recent
};

// Utility functions for PatientAvatar
const getInitials = (name: string) => {
  if (!name) return '';
  const parts = name.split(' ').filter(part => part.length > 0);
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : parts[0].substring(0, 2).toUpperCase();
};

// Components
const SortIcon = ({
  column,
  sortColumn,
  sortDirection,
}: {
  column: string;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
}) => {
  const reverseFieldMap: Record<string, string> = {
    first_name: 'name',
    status: 'status',
    addresses__city: 'location',
    date_of_birth: 'age',
    last_visit: 'last_visit',
    isi_scores__score: 'isi_score',
  };

  const frontendField = reverseFieldMap[sortColumn];
  if (column !== frontendField) return null;
  return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
};

const StatusBadge = ({ status }: { status: Patient['status'] }) => {
  const statusClasses = clsx('px-2 py-1 rounded-full text-xs font-medium', {
    'bg-green-100 text-green-800': status === 'active',
    'bg-blue-100 text-blue-800': status === 'inquiry',
    'bg-yellow-100 text-yellow-800': status === 'onboarding',
    'bg-red-100 text-red-800': status === 'churned',
  });

  return (
    <span className={statusClasses}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const PatientAvatar = ({ name }: { name: string }) => {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name);
  const bgColor = `hsl(${name.length * 10 % 360}, 70%, 80%)`;

  return (
    <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-300">
      {!imageError ? (
        <Image
          src="/icons/stellar-sleep.png"
          alt={name}
          width={48}
          height={48}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-gray-800 font-medium"
          style={{ backgroundColor: bgColor }}
        >
          {initials}
        </div>
      )}
    </div>
  );
};

export function PatientTable({
  patients,
  onPatientClick,
  isLoading,
  sortColumn,
  sortDirection,
  onSort,
}: PatientTableProps) {
  const columns: ColumnConfig[] = [
    {
      key: 'name',
      header: 'Name',
      width: '2fr',
      sortable: true,
      render: patient => (
        <div className="flex items-center gap-3">
          <PatientAvatar name={getPatientName(patient)} />
          <span className="font-medium truncate">
            {getPatientName(patient)}
          </span>
        </div>
      ),
    },
    {
      key: 'age',
      header: 'Age',
      width: '1fr',
      sortable: true,
      render: patient => (
        <span>{calculateAge(patient.date_of_birth)} years</span>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      width: '1fr',
      sortable: true,
      render: patient => {
        const address = getPrimaryAddress(patient);
        return (
          <span className="truncate">
            {address ? `${address.city}, ${address.state}` : '-'}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '1fr',
      sortable: true,
      render: patient => <StatusBadge status={patient.status} />,
    },
    {
      key: 'isi_score',
      header: 'ISI Score',
      width: '1fr',
      sortable: true,
      render: patient => {
        const latestScore = getLatestISIScore(patient.isi_scores);
        return (
          <span className={latestScore ? 'font-medium' : 'text-gray-400'}>
            {latestScore ? latestScore.score : '-'}
          </span>
        );
      },
    },
    {
      key: 'last_visit',
      header: 'Last Visit',
      width: '1fr',
      sortable: true,
      render: patient => (
        <span>
          {patient.last_visit
            ? new Date(patient.last_visit).toLocaleDateString()
            : '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="w-full h-full overflow-y-scroll min-h-[400px]">
      <div className="w-full min-w-full">
        <div
          className="sticky top-0 z-10 grid items-center bg-gray-50"
          style={{
            gridTemplateColumns: columns.map(col => col.width).join(' '),
            minWidth: '100%',
            width: '100%',
          }}
        >
          {columns.map(column => (
            <div
              key={column.key}
              className={clsx(
                'py-4 pl-6 text-left text-sm font-medium text-gray-500 bg-gray-50',
                column.sortable && 'cursor-pointer hover:bg-gray-100',
              )}
              onClick={() => column.sortable && onSort(column.key)}
            >
              <div className="flex items-center">
                {column.header}
                {column.sortable && (
                  <SortIcon
                    column={column.key}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        {isLoading && patients.length === 0 ? (
          <div
            className="grid items-center"
            style={{
              gridTemplateColumns: columns.map(col => col.width).join(' '),
              minWidth: '100%',
              width: '100%',
            }}
          >
            <div className="col-span-full py-4 pl-6 text-center text-gray-500">
              Loading...
            </div>
          </div>
        ) : patients.length === 0 ? (
          <div
            className="grid items-center"
            style={{
              gridTemplateColumns: columns.map(col => col.width).join(' '),
              minWidth: '100%',
              width: '100%',
            }}
          >
            <div className="col-span-full py-4 pl-6 text-center text-gray-500">
              No patients found
            </div>
          </div>
        ) : (
          patients.map(patient => (
            <div
              key={patient.id}
              onClick={() => onPatientClick(patient)}
              className="grid items-center hover:bg-gray-50 cursor-pointer"
              style={{
                gridTemplateColumns: columns.map(col => col.width).join(' '),
                minWidth: '100%',
                width: '100%',
              }}
            >
              {columns.map(column => (
                <div
                  key={column.key}
                  className="py-4 pl-6 text-sm text-gray-900"
                >
                  <div className="flex items-center">
                    {column.render(patient)}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

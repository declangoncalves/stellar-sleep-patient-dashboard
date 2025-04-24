// frontend/src/components/PatientCard.tsx
'use client';

import clsx from 'clsx';
import { format } from 'date-fns';
import type { Patient } from '../../lib/types';

interface PatientListCardProps {
  patient: Patient;
}

/**
 * A card component to display summary info for a patient.
 * Clickable to navigate to the patient detail page.
 */
export function PatientListCard({ patient }: PatientListCardProps) {
  const { first_name, middle_name, last_name, date_of_birth, status } = patient;
  const fullName =
    `${first_name}${middle_name ? ` ${middle_name}` : ''} ${last_name}`.trim();

  // Format date of birth if available
  const dobFormatted = date_of_birth
    ? format(new Date(date_of_birth), 'MMM d, yyyy')
    : null;

  // Status badge colors
  const statusClasses = clsx(
    'px-2 py-1 text-xs font-semibold rounded-full capitalize',
    {
      'bg-yellow-100 text-yellow-800': status === 'inquiry',
      'bg-blue-100 text-blue-800': status === 'onboarding',
      'bg-green-100 text-green-800': status === 'active',
      'bg-red-100 text-red-800': status === 'churned',
    },
  );

  return (
    <div className="block p-4 hover:bg-blue-50 rounded-lg shadow hover:shadow-md transition">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-gray-800">{fullName}</h3>
        <span className={statusClasses}>{status}</span>
      </div>
      {dobFormatted && (
        <p className="text-sm text-gray-600">Date of Birth: {dobFormatted}</p>
      )}
    </div>
  );
}

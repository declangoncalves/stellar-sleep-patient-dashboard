'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Button } from '@/components/Button/Button';
import { AdditionalPatientInfo } from './AdditionalPatientInfo';
import { GeneralPatientInfo } from './GeneralPatientInfo';
import { SleepPatientInfo } from './SleepPatientInfo';
import { PatientFormProvider, usePatientForm } from './PatientFormContext';
import { Patient } from '@/lib/types';

interface PatientInfoProps {
  patient: Patient;
  onSaved: (updated: Patient) => void;
  onClose: () => void;
  isCreateMode?: boolean;
}

type TabType = 'basic' | 'sleep' | 'additional';

function PatientInfoContent({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const {
    formData,
    errors,
    isSaving,
    save,
    updateField,
    updateAddress,
    addAddress,
    deleteAddress,
    updateISIScore,
    deleteISIScore,
    updateCustomField,
  } = usePatientForm();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none">
        <div className="pb-4">
          <nav className="-mb-px flex space-x-8 pb-4">
            <Button
              variant="ghost"
              onClick={() => setActiveTab('basic')}
              className={clsx(
                'py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === 'basic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              )}
            >
              Basic Information
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab('sleep')}
              className={clsx(
                'py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === 'sleep'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              )}
            >
              Sleep Tracking
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab('additional')}
              className={clsx(
                'py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === 'additional'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              )}
            >
              Additional Information
            </Button>
          </nav>
        </div>
      </div>

      <div className="flex-1 overflow-auto pr-2">
        {activeTab === 'basic' && (
          <GeneralPatientInfo
            formData={formData}
            errors={errors}
            onUpdate={updateField}
            onUpdateAddress={updateAddress}
            onAddAddress={addAddress}
            onRemoveAddress={deleteAddress}
          />
        )}
        {activeTab === 'sleep' && (
          <SleepPatientInfo
            isiScores={formData.isi_scores}
            onISIScoresChange={updateISIScore}
            onDeleteScore={deleteISIScore}
            errors={errors.isi_scores}
          />
        )}
        {activeTab === 'additional' && (
          <AdditionalPatientInfo
            patientId={formData.id}
            customFieldValues={formData.custom_field_values}
            onUpdate={updateCustomField}
          />
        )}
      </div>

      <div className="flex-none pt-4 border-t">
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PatientInfo({
  patient,
  onSaved,
  onClose,
  isCreateMode = false,
}: PatientInfoProps) {
  return (
    <PatientFormProvider
      patient={patient}
      onSaved={onSaved}
      isCreateMode={isCreateMode}
    >
      <PatientInfoContent onClose={onClose} />
    </PatientFormProvider>
  );
}

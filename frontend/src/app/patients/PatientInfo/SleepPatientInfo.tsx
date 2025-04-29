'use client';

import { useCallback, memo } from 'react';
import { Button } from '@/components/Button/Button';
import { LineChart } from '@/components/LineChart/LineChart';
import { Input } from '@/components/Input/Input';
import { ISIScore } from '@/lib/types';
import { PlusIcon } from '@heroicons/react/24/solid';

interface SleepPatientInfoProps {
  isiScores: ISIScore[];
  onISIScoresChange: (
    index: number,
    field: keyof ISIScore,
    value: string | number,
  ) => void;
  onDeleteScore: (index: number) => void;
  onAddScore: () => void;
  errors?: { [key: number]: string };
}

function SleepPatientInfoComponent({
  isiScores,
  onISIScoresChange,
  onDeleteScore,
  onAddScore,
  errors = {},
}: SleepPatientInfoProps) {
  const handleScoreChange = (
    index: number,
    field: keyof ISIScore,
    value: string | number,
  ) => {
    onISIScoresChange(index, field, value);
  };

  const validScores = isiScores.filter(
    score => typeof score.score === 'number' && typeof score.date === 'string',
  );

  const chartData = validScores.map(score => ({
    x: score.date,
    y: score.score,
  }));

  const handleDeleteScore = useCallback(
    (index: number) => {
      onDeleteScore(index);
    },
    [onDeleteScore],
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">ISI Scores</h3>
      </div>

      <div className="h-64">
        <LineChart data={chartData} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <div className="grid grid-cols-3 gap-4 pl-4">
          <div className="text-sm flex items-end font-medium text-gray-700">
            Score
          </div>
          <div className="text-sm flex items-end font-medium text-gray-700">
            Date
          </div>
          <div className="flex justify-end">
            <Button variant="primary" onClick={onAddScore}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Score
            </Button>
          </div>
        </div>
        {isiScores.map((score, index) => {
          const scoreError = errors[index];
          return (
            <div key={index} className="p-4 bg-gray-100 rounded space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Input
                  value={score.score ?? ''}
                  onChange={e => {
                    const value =
                      e.target.value === '' ? '' : parseInt(e.target.value);
                    handleScoreChange(index, 'score', value);
                  }}
                  error={scoreError}
                  type="number"
                />
                <Input
                  value={score.date ?? ''}
                  onChange={e =>
                    handleScoreChange(index, 'date', e.target.value)
                  }
                  type="date"
                />
                <div className="flex justify-end items-end">
                  <Button
                    variant="danger"
                    onClick={() => handleDeleteScore(index)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        {isiScores.length === 0 && (
          <div className="pl-4 pt-4 text-gray-500">No sleep scores added</div>
        )}
      </div>
    </div>
  );
}

export const SleepPatientInfo = memo(SleepPatientInfoComponent);

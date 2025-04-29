'use client';

import { useCallback, memo } from 'react';
import { Button } from '@/components/Button/Button';
import { LineChart } from '@/components/LineChart/LineChart';
import { Input } from '@/components/Input/Input';
import { ISIScore } from '@/lib/types';

interface SleepPatientInfoProps {
  isiScores: ISIScore[];
  onISIScoresChange: <T extends keyof ISIScore>(
    index: number,
    field: T,
    value: ISIScore[T],
  ) => void;
  onDeleteScore: (index: number) => void;
  errors?: { [key: number]: string };
}

function SleepPatientInfoComponent({
  isiScores,
  onISIScoresChange,
  onDeleteScore,
  errors = {},
}: SleepPatientInfoProps) {
  // First filter to keep only entries with both valid date and numeric score
  const validScores = isiScores.filter(
    (score): score is typeof score & { score: number } =>
      typeof score.date === 'string' && typeof score.score === 'number',
  );

  // Then map to the format expected by LineChart
  const chartData = validScores.map(score => ({
    x: score.date,
    y: score.score,
  }));

  const handleScoreChange = useCallback(
    (index: number, field: keyof ISIScore, value: string | number) => {
      if (field === 'score') {
        onISIScoresChange(index, field, value as number);
      } else if (field === 'date') {
        onISIScoresChange(index, field, value as string);
      } else if (field === 'id') {
        onISIScoresChange(index, field, value.toString());
      }
    },
    [onISIScoresChange],
  );

  const handleDeleteScore = useCallback(
    (index: number) => {
      onDeleteScore(index);
    },
    [onDeleteScore],
  );

  const handleAddScore = useCallback(() => {
    const newIndex = isiScores.length;
    onISIScoresChange(newIndex, 'id', '0');
    onISIScoresChange(newIndex, 'score', 0);
    onISIScoresChange(newIndex, 'date', new Date().toISOString().split('T')[0]);
  }, [isiScores.length, onISIScoresChange]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">ISI Scores</h3>
        <Button variant="outline" onClick={handleAddScore}>
          Add Score
        </Button>
      </div>

      <div className="h-64">
        <LineChart data={chartData} />
      </div>

      <div className="space-y-4">
        {isiScores.map((score, index) => {
          const scoreError = errors[index];
          return (
            <div
              key={index}
              className="grid grid-cols-2 gap-4 p-4 border rounded"
            >
              <div>
                <Input
                  label="Score"
                  type="number"
                  value={score.score ?? ''}
                  onChange={e => {
                    const value =
                      e.target.value === '' ? 0 : parseInt(e.target.value);
                    handleScoreChange(index, 'score', value);
                  }}
                  error={scoreError}
                />
              </div>
              <div>
                <div className="flex gap-2">
                  <Input
                    label="Date"
                    type="date"
                    value={score.date ?? ''}
                    onChange={e =>
                      handleScoreChange(index, 'date', e.target.value)
                    }
                  />
                  <Button
                    variant="ghost"
                    onClick={() => handleDeleteScore(index)}
                    className="self-end"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const SleepPatientInfo = memo(SleepPatientInfoComponent);

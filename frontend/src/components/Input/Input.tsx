import { forwardRef } from 'react';
import clsx from 'clsx';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, required, options, ...props }, ref) => {
    if (options) {
      return (
        <div className="flex flex-col space-y-1">
          {label && (
            <label className="block text-sm font-medium text-gray-700">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <select
            className={clsx(
              'mt-1 h-12 px-3 block w-full rounded-sm bg-white border border-gray-200 shadow-sm',
              'focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm',
              error && 'border-red-300',
              className,
            )}
            {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {error && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          max={props.type === 'date' ? '2999-12-31' : props.max}
          className={clsx(
            'mt-1 h-12 px-3 block w-full rounded-sm bg-white border border-gray-200 shadow-sm',
            'focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm',
            error && 'border-red-300',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

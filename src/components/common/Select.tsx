import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <select
        className={`px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
      )}
    </div>
  );
};

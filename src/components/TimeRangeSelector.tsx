import React from 'react';
import TimeRange from '../types/TimeRange';
import './TimeRangeSelector.scss';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  disabled?: boolean;
}

const RANGES: { label: string; value: TimeRange }[] = [
  { label: '1M', value: '30' },
  { label: '3M', value: '90' },
  { label: '6M', value: '180' },
  { label: '1Y', value: '365' },
  { label: 'ALL', value: 'all' },
];

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ value, onChange, disabled }) => (
  <div className="time-range-selector">
    {RANGES.map(({ label, value: rangeValue }) => (
      <button
        key={rangeValue}
        className={`time-range-selector__btn${value === rangeValue ? ' time-range-selector__btn--active' : ''}`}
        onClick={() => onChange(rangeValue)}
        disabled={disabled}
      >
        {label}
      </button>
    ))}
  </div>
);

export default TimeRangeSelector;

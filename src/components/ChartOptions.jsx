import React from 'react';
import './ChartOptions.scss';

const ChartOptions = ({ options, selected, onChange }) => {
  return (
    <div className="chart-options">
      {options.map((choice, index) => (
        <label key={index}>
          <input type="radio"
            name="vote"
            value={choice.value}
            key={index}
            checked={selected === choice.value}
            onChange={onChange} />
          {choice.text}
        </label>
      ))}
    </div>
  );
};

export default ChartOptions;

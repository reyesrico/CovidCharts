import React, { useState, useEffect, useRef } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { isEqual } from 'lodash';
import { useTranslation } from 'react-i18next';

import CountryDataRow from '../types/CountryDataRow';
import MakeChartProps from '../types/MakeChartProps';

import './MakeChart.scss';

const SERIES_COLORS: Record<string, string> = {
  Confirmed:    '#457B9D',
  Deaths:       '#E63946',
  Recovered:    '#2A9D8F',
  Active:       '#F4A261',
  ConfirmedInc: '#457B9D',
  DeathsInc:    '#E63946',
  RecoveredInc: '#2A9D8F',
  ActiveInc:    '#F4A261',
};

const SERIES_DASHES: Record<string, string | undefined> = {
  ConfirmedInc: '5 5',
  DeathsInc:    '5 5',
  RecoveredInc: '5 5',
  ActiveInc:    '5 5',
};

const SERIES_FILL_OPACITY: Record<string, number> = {
  Confirmed:    0.15,
  Deaths:       0.15,
  Recovered:    0.15,
  Active:       0.15,
  ConfirmedInc: 0,
  DeathsInc:    0,
  RecoveredInc: 0,
  ActiveInc:    0,
};

type LocalRange = '7' | '30' | '90' | '180' | '365' | 'all';

const LOCAL_RANGES: { label: string; value: LocalRange }[] = [
  { label: '1W', value: '7' },
  { label: '1M', value: '30' },
  { label: '3M', value: '90' },
  { label: '6M', value: '180' },
  { label: '1Y', value: '365' },
  { label: 'ALL', value: 'all' },
];

type YValues = {
  Confirmed: boolean;
  Deaths: boolean;
  Recovered: boolean;
  Active: boolean;
  ConfirmedInc: boolean;
  DeathsInc: boolean;
  RecoveredInc: boolean;
  ActiveInc: boolean;
};

const buildChartData = (data: CountryDataRow[]) =>
  data.map((row, i) => {
    const prev = i > 0 ? data[i - 1] : row;
    return {
      Date:         row.Date,
      Confirmed:    row.Confirmed,
      Deaths:       row.Deaths,
      Recovered:    row.Recovered,
      Active:       row.Active,
      ConfirmedInc: Math.max(0, row.Confirmed - prev.Confirmed),
      DeathsInc:    Math.max(0, row.Deaths    - prev.Deaths),
      RecoveredInc: Math.max(0, row.Recovered - prev.Recovered),
      ActiveInc:    Math.max(0, row.Active    - prev.Active),
    };
  });

const DEFAULT_Y_VALUES: YValues = {
  Confirmed:    true,
  Deaths:       false,
  Recovered:    false,
  Active:       false,
  ConfirmedInc: false,
  DeathsInc:    false,
  RecoveredInc: false,
  ActiveInc:    false,
};

const MakeChart: React.FC<MakeChartProps> = ({ data, countries, map }) => {
  const { t } = useTranslation();
  const [yValues, setYValues] = useState<YValues>(DEFAULT_Y_VALUES);
  const [localRange, setLocalRange] = useState<LocalRange>('all');
  const prevDataRef = useRef<CountryDataRow[]>([]);

  useEffect(() => {
    if (!isEqual(prevDataRef.current, data)) {
      prevDataRef.current = data;
      setYValues(DEFAULT_Y_VALUES);
      setLocalRange('all');
    }
  }, [data]);

  const changeInput = (key: keyof YValues) => {
    const next = { ...yValues, [key]: !yValues[key] };
    if (!Object.values(next).some(Boolean)) next.Confirmed = true;
    setYValues(next);
  };

  if (!data || !data.length) return <div className="make-chart__empty">{t('chart.noData')}</div>;

  const filteredData = (() => {
    if (localRange === 'all') return data;
    const lastDate = new Date(data[data.length - 1].Date);
    const cutoff = new Date(lastDate);
    cutoff.setDate(cutoff.getDate() - parseInt(localRange, 10));
    const filtered = data.filter(row => new Date(row.Date) >= cutoff);
    return filtered.length > 0 ? filtered : data;
  })();

  const chartData = buildChartData(filteredData);

  return (
    <div className="make-chart">
      <div className="make-chart__options">
        <div className="make-chart__label">{t('makechart.values')}</div>
        {(Object.keys(yValues) as (keyof YValues)[]).map(key => (
          <label key={key} className="make-chart__checkbox">
            <input
              type="checkbox"
              checked={yValues[key]}
              onChange={() => changeInput(key)}
            />
            {key}
          </label>
        ))}
      </div>
      <div className="make-chart__chart-area">
        <div className="make-chart__range-selector">
          {LOCAL_RANGES.map(({ label, value }) => (
            <button
              key={value}
              className={`make-chart__range-btn${localRange === value ? ' make-chart__range-btn--active' : ''}`}
              onClick={() => setLocalRange(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
            <defs>
              {(Object.keys(yValues) as (keyof YValues)[]).filter(k => yValues[k]).map(key => (
                <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={SERIES_COLORS[key]} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={SERIES_COLORS[key]} stopOpacity={0}    />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="Date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            {(Object.keys(yValues) as (keyof YValues)[]).map(key =>
              yValues[key] ? (
                SERIES_FILL_OPACITY[key] > 0 ? (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={SERIES_COLORS[key]}
                    strokeDasharray={SERIES_DASHES[key]}
                    fill={`url(#fill-${key})`}
                    dot={false}
                    isAnimationActive={false}
                  />
                ) : (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={SERIES_COLORS[key]}
                    strokeDasharray={SERIES_DASHES[key]}
                    dot={false}
                    isAnimationActive={false}
                  />
                )
              ) : null
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MakeChart;

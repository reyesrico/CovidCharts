import React, { useState, useEffect, useRef } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import dayjs from 'dayjs';
import { isEqual } from 'lodash';
import { useTranslation } from 'react-i18next';

import CountryDataRow from '../types/CountryDataRow';
import ProjectionsProps from '../types/ProjectionsProps';
import './Projections.scss';

/**
 * Holt-Winters triple exponential smoothing.
 * Re-implements nostradamus to avoid its `st_1` undeclared-var bug in strict-mode ESM.
 * Same algorithm & parameter order: forecast(data, alpha, beta, gamma, period, m)
 * Returns a Float64Array of length data.length + m; the last m elements are the forecast.
 */
function hwForecast(
  data: number[], alpha: number, beta: number, gamma: number, period: number, m: number
): number[] {
  if (!data.length || m <= 0 || m > period || data.length < period * 2) return [];

  const seasons = Math.floor(data.length / period);

  // Initial level & trend
  const stInitial = data[0];                         // was `st_1` (global in nostradamus → boom)
  let bInitial = 0;
  for (let i = 0; i < period; i++) bInitial += (data[period + i] - data[i]);
  bInitial /= (period * period);

  // Seasonal indices
  const savg   = new Array<number>(seasons).fill(0);
  const obsavg = new Array<number>(data.length).fill(0);
  const si     = new Array<number>(period).fill(0);
  for (let i = 0; i < seasons; i++) {
    for (let j = 0; j < period; j++) savg[i] += data[i * period + j];
    savg[i] /= period;
  }
  for (let i = 0; i < seasons; i++)
    for (let j = 0; j < period; j++)
      obsavg[i * period + j] = data[i * period + j] / savg[i];
  for (let i = 0; i < period; i++) {
    for (let j = 0; j < seasons; j++) si[i] += obsavg[j * period + i];
    si[i] /= seasons;
  }

  // Main HW loop
  const len = data.length;
  const st = new Array<number>(len).fill(0);
  const bt = new Array<number>(len).fill(0);
  const it = new Array<number>(len + m).fill(0);
  const ft = new Array<number>(len + m).fill(0);

  st[1] = stInitial;
  bt[1] = bInitial;
  for (let i = 0; i < period; i++) it[i] = si[i];

  for (let i = 2; i < len; i++) {
    st[i] = i - period >= 0
      ? ((alpha * data[i]) / it[i - period]) + ((1 - alpha) * (st[i - 1] + bt[i - 1]))
      : (alpha * data[i]) + ((1 - alpha) * (st[i - 1] + bt[i - 1]));
    bt[i] = (gamma * (st[i] - st[i - 1])) + ((1 - gamma) * bt[i - 1]);
    if (i - period >= 0)
      it[i] = ((beta * data[i]) / st[i]) + ((1 - beta) * it[i - period]);
    if (i + m < len + m)
      ft[i + m] = (st[i] + (m * bt[i])) * it[i - period + m];
  }

  return ft;
}

const Y_VALS = [
  { value: 'Confirmed', text: 'Confirmed' },
  { value: 'Deaths',    text: 'Deaths'    },
  { value: 'Recovered', text: 'Recovered' },
  { value: 'Active',    text: 'Active'    },
];

const WEEK_OPTIONS = [1, 2, 3, 4, 6, 8, 12];
const PERIOD = 7;

/** Run Holt-Winters to append weeksAhead * PERIOD future data points to the series. */
const computeProjections = (
  data: CountryDataRow[],
  ySlc: string,
  weeksAhead: number,
  alpha = 0.5, beta = 0.4, gamma = 0.1
): number[] => {
  if (!data || data.length < PERIOD * 2) return [];
  const values = data.map((row) => {
    const v = (row as any)[ySlc];
    return (typeof v === 'number' && isFinite(v) && v > 0) ? v : 1;
  });
  const offset = values.length % PERIOD;
  let series = values.slice(offset);
  for (let i = 0; i < weeksAhead; i++) {
    const result = hwForecast(series, alpha, beta, gamma, PERIOD, PERIOD);
    if (!result.length) break;
    // hwForecast returns array of length series.length + PERIOD; last PERIOD values are forecast
    const newPts = result.slice(result.length - PERIOD).map((v: number) => Math.max(1, Math.round(v)));
    if (newPts.some(isNaN)) break;
    series = [...series, ...newPts];
  }
  return series;
};

/** Build chart rows separating historical (Actual area) from future (Forecast dashed line). */
const buildChartData = (
  data: CountryDataRow[],
  projections: number[],
  ySlc: string
): any[] => {
  if (!projections.length || !data.length) return [];
  const offset = data.length % PERIOD;

  // Average ms between samples (handles sparse API data)
  const dateStep = data.length >= 2
    ? (dayjs(data[data.length - 1].Date).valueOf() - dayjs(data[0].Date).valueOf()) / (data.length - 1)
    : 86400000;

  const rows: any[] = [];
  const lastHistoricalIdx = data.length - offset - 1; // index in projections[] of last historical point

  projections.forEach((value, idx) => {
    const dataIdx = idx + offset;
    if (dataIdx < data.length) {
      // Historical point — bridge: last historical also keeps Forecast so lines connect
      const isLast = idx === lastHistoricalIdx;
      rows.push({
        date:     dayjs(data[dataIdx].Date).format('MM/DD/YY'),
        Actual:   (data[dataIdx] as any)[ySlc],
        Forecast: isLast ? (data[dataIdx] as any)[ySlc] : null,
      });
    } else {
      const stepsAhead = dataIdx - (data.length - 1);
      const ts = dayjs(data[data.length - 1].Date).valueOf() + stepsAhead * dateStep;
      rows.push({
        date:     dayjs(ts).format('MM/DD/YY'),
        Actual:   null,
        Forecast: value,
      });
    }
  });

  return rows;
};

const ProjectionsHW: React.FC<ProjectionsProps> = ({ data }) => {
  const { t } = useTranslation();
  const [projections, setProjections] = useState<number[]>([]);
  const [weeksAhead, setWeeksAhead] = useState(2);
  const [ySlc, setYSlc] = useState('Confirmed');
  const prevDataRef = useRef(data);

  const recompute = (d: CountryDataRow[], metric: string, weeks: number) => {
    setProjections(computeProjections(d, metric, weeks));
  };

  useEffect(() => {
    if (!data || data.length === 0) return;
    recompute(data, ySlc, weeksAhead);
  }, []);

  useEffect(() => {
    if (!data || data.length === 0) return;
    if (!isEqual(prevDataRef.current, data)) {
      prevDataRef.current = data;
      setYSlc('Confirmed');
      setWeeksAhead(2);
      recompute(data, 'Confirmed', 2);
    }
  }, [data]);

  useEffect(() => {
    if (!data || data.length === 0) return;
    recompute(data, ySlc, weeksAhead);
  }, [ySlc, weeksAhead]);

  const chartData = buildChartData(data, projections, ySlc);
  const splitDate  = chartData.find(r => r.Actual === null && r.Forecast !== null)?.date;

  return (
    <div className="hw">
      {/* Controls */}
      <div className="hw__controls">
        <div className="hw__control-group">
          <span className="hw__label">{t('projections.metric')}</span>
          <div className="hw__pills">
            {Y_VALS.map(({ value, text }) => (
              <button
                key={value}
                className={`hw__pill${ySlc === value ? ' hw__pill--active' : ''}`}
                onClick={() => setYSlc(value)}
              >
                {text}
              </button>
            ))}
          </div>
        </div>
        <div className="hw__control-group">
          <span className="hw__label">{t('projections.weeksAhead')}</span>
          <div className="hw__pills">
            {WEEK_OPTIONS.map(w => (
              <button
                key={w}
                className={`hw__pill${weeksAhead === w ? ' hw__pill--active' : ''}`}
                onClick={() => setWeeksAhead(w)}
              >
                {w}W
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      {!projections.length
        ? <div className="hw__empty">{t('projections.noData', { n: PERIOD * 2 })}</div>
        : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="hwActualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#457B9D" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#457B9D" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {splitDate && (
                <ReferenceLine x={splitDate} stroke="#aaa" strokeDasharray="4 4" label={{ value: 'Forecast →', fontSize: 11, fill: '#888' }} />
              )}
              <Area
                type="monotone"
                dataKey="Actual"
                stroke="#457B9D"
                fill="url(#hwActualGrad)"
                dot={false}
                isAnimationActive={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="Forecast"
                stroke="#E63946"
                strokeDasharray="6 3"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
    </div>
  );
};

export default ProjectionsHW;


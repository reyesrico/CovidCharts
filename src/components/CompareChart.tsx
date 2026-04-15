import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import ChartOptions from './ChartOptions';
import CompareChartProps from '../types/CompareChartProps';
import CountryDataRow from '../types/CountryDataRow';
import { getCountryByDateRange } from '../helpers/Service';
import { getDaysAgoDate, formatDate } from '../helpers/DateHelper';

import './CompareChart.scss';

const Y_VALUES = [
  { value: 'Confirmed', text: 'Confirmed' },
  { value: 'Deaths', text: 'Deaths' },
  { value: 'Recovered', text: 'Recovered' },
  { value: 'Active', text: 'Active' },
];

const CompareChart: React.FC<CompareChartProps> = ({ countryCompare, hasProvinces, timeRange, data }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [countryData, setCountryData] = useState<CountryDataRow[]>([]);
  const [selectedY, setSelectedY] = useState('Confirmed');

  useEffect(() => {
    setCountryData([]);
    if (!hasProvinces) {
      setIsLoading(true);
      const dateTo = formatDate(new Date());
      const dateFrom = timeRange === 'all'
        ? '2020-01-22'
        : formatDate(getDaysAgoDate(parseInt(timeRange, 10)));
      getCountryByDateRange(countryCompare.value, dateFrom, dateTo)
        .then(res => setCountryData(res.data))
        .finally(() => setIsLoading(false));
    }
  }, [countryCompare, timeRange]);

  const getData = () => {
    let series: any = [];
    if (data.length && countryData.length) {
      let map: any = {};
      countryData.forEach((row: CountryDataRow) => {
        map = { ...map, [row.Date]: row };
      });
      series = data.map((row: CountryDataRow) => {
        const otherCountry: CountryDataRow = map[row.Date];
        return {
          // @ts-ignore
          [row.Country]: row[selectedY],
          // @ts-ignore
          [countryCompare.label]: otherCountry ? otherCountry[selectedY] : 0,
          Date: row.Date,
        };
      });
    }
    return series;
  };

  const chartData = getData();

  if (hasProvinces) return <div>Country not available to compare</div>;

  return (
    <div className="compare-chart">
      <div className="compare-chart__options">
        <div className="compare-chart__values">Values (Y Axis)</div>
        <ChartOptions options={Y_VALUES} selected={selectedY}
          onChange={(event: any) => event && setSelectedY(event.target.value)} />
      </div>
      <hr />
      {(!chartData || !chartData.length) ? (
        <div>Data not available</div>
      ) : (() => {
        const keys = Object.keys(chartData[0]);
        return (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="color1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#457B9D" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#457B9D" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="color2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E63946" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#E63946" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="Date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Area type="monotone" dataKey={keys[0]} stroke="#457B9D" fillOpacity={1} fill="url(#color1)" />
              <Area type="monotone" dataKey={keys[1]} stroke="#E63946" fillOpacity={1} fill="url(#color2)" />
            </AreaChart>
          </ResponsiveContainer>
        );
      })()}
    </div>
  );
};

export default CompareChart;
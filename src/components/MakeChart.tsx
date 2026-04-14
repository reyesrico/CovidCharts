import React, { Component } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { isEqual } from 'lodash';

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

class MakeChart extends Component<MakeChartProps, { yValues: YValues }> {
  state = {
    yValues: {
      Confirmed:    true,
      Deaths:       false,
      Recovered:    false,
      Active:       false,
      ConfirmedInc: false,
      DeathsInc:    false,
      RecoveredInc: false,
      ActiveInc:    false,
    } as YValues
  }

  componentDidUpdate(prevProps: MakeChartProps) {
    // Reset to Confirmed when data changes
    if (!isEqual(prevProps.data, this.props.data)) {
      this.setState({
        yValues: {
          Confirmed: true, Deaths: false, Recovered: false, Active: false,
          ConfirmedInc: false, DeathsInc: false, RecoveredInc: false, ActiveInc: false,
        }
      });
    }
  }

  changeInput = (key: keyof YValues) => {
    const yValues = { ...this.state.yValues, [key]: !this.state.yValues[key] };
    // prevent all-unchecked: revert to Confirmed
    if (!Object.values(yValues).some(Boolean)) yValues.Confirmed = true;
    this.setState({ yValues });
  }

  renderOptions() {
    const { yValues } = this.state;
    return (
      <div className="make-chart__options">
        <div className="make-chart__label">Values (Y Axis)</div>
        {(Object.keys(yValues) as (keyof YValues)[]).map(key => (
          <label key={key} className="make-chart__checkbox">
            <input
              type="checkbox"
              checked={yValues[key]}
              onChange={() => this.changeInput(key)}
            />
            {key}
          </label>
        ))}
      </div>
    );
  }

  render() {
    const { data } = this.props;
    const { yValues } = this.state;
    const chartData = buildChartData(data);

    return (
      <div className="make-chart">
        {this.renderOptions()}
        <hr />
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="Date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            {(Object.keys(yValues) as (keyof YValues)[]).map(key =>
              yValues[key] ? (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={SERIES_COLORS[key]}
                  strokeDasharray={SERIES_DASHES[key]}
                  dot={false}
                  isAnimationActive={false}
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
}

export default MakeChart;

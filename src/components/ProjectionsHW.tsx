import React, { Component } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import dayjs from 'dayjs';
import { isEqual, range } from 'lodash';
import forecast from 'nostradamus';

import CountryDataRow from '../types/CountryDataRow';
import ProjectionsProps from '../types/ProjectionsProps';
import './Projections.scss';

class ProjectionsHW extends Component<ProjectionsProps, any> {
  state = {
    isLoading: false,
    predictions: [],
    period: 7,
    maxRange: 2,
    ySlc: 'Confirmed',
    yVals: [
      { value: 'Confirmed', text: 'Confirmed' }, 
      { value: 'Deaths', text: 'Deaths' },
      { value: 'Recovered', text: 'Recovered' }, 
      { value: 'Active', text: 'Active' },
    ],
  }

  componentDidMount() {
    this.getPredictions();
  }

  componentDidUpdate(prevProps: ProjectionsProps, prevState: any) {
    if (!isEqual(prevProps.data, this.props.data)) {
      this.setState({
        isLoading: false,
        predictions: [],
        period: 7,
        maxRange: 2,
        ySlc: 'Confirmed',    
      });

      this.getPredictions();
    }

    if (!isEqual(prevState.maxRange, this.state.maxRange) ||
        !isEqual(prevState.ySlc, this.state.ySlc)) {
      this.getPredictions();
    }
  }


  getPredictions = (alpha = 0.5, beta = 0.4, gamma = 0.1) => {
    const { data } = this.props;
    const { period, maxRange, ySlc } = this.state;

    // @ts-ignore
    let values = data.map((row: CountryDataRow) => row[ySlc]);
    const offset = values.length % period;
    let valuesLimited = values.slice(offset);
    let predictions: any = [];

    range(0, maxRange).forEach(() => {
      predictions = forecast(valuesLimited, alpha, beta, gamma, period, period);
      // Get last 7 predictions and clean (round)
      let cleanPredictions = [...predictions.slice(predictions.length - period)]
        .map((value: number) => Math.round(value));

      console.log(cleanPredictions);
      valuesLimited = [ ...valuesLimited, ...cleanPredictions ];
      console.log(valuesLimited);
    });

    this.setState({ predictions: valuesLimited });
  }

  buildProjectionData = () => {
    const { data } = this.props;
    const { predictions, ySlc, period } = this.state;
    if (!(predictions as number[]).length) return [];

    const dateSize =
      data.length >= 2 && data[0].Date && data[1].Date
        ? dayjs(data[1].Date).valueOf() - dayjs(data[0].Date).valueOf()
        : 86400000;
    const offset = data.length % period;
    let projectedDate = data.length > 0 ? dayjs(data[data.length - 1].Date).valueOf() : dayjs().valueOf();

    return (predictions as number[]).map((value, index) => {
      const actualIndex = index + offset;
      const row = actualIndex < data.length ? data[actualIndex] : null;
      if (!row) projectedDate += dateSize;
      const ts = row ? dayjs(row.Date).valueOf() : projectedDate;
      return {
        date: dayjs(ts).format('MM/DD/YY'),
        // @ts-expect-error
        [ySlc]: row ? row[ySlc] : null,
        Predicted: value,
      };
    });
  }

  renderChart() {
    const data = this.buildProjectionData();
    const { ySlc } = this.state;

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey={ySlc} stroke="#457B9D" dot={false} isAnimationActive={false} connectNulls={false} />
          <Line type="monotone" dataKey="Predicted" stroke="#FF00FF" strokeDasharray="5 5" dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  renderOptions = () => {
    const { yVals, ySlc } = this.state;
   
    return (
      <div className="compare-chart__options">
        <div className="compare-chart__values">Values (Y Axis)</div>
        <div className="chart-options">
          {yVals.map((choice, index) => (
            <label key={index}>
              <input type="radio"
                value={choice.value}
                key={index}
                checked={ySlc === choice.value}
                onChange={(event: any) => event && this.setState({ ySlc: event.target.value })} />
              {choice.text}
            </label>
          ))}
        </div>
      </div>
    )
  }

  render() {
    const { predictions, maxRange } = this.state;

    return (
    <div className="projections">
      {this.renderOptions()}
      <hr />
      <div className="projections__choose">
        <div>Choose # of weeks to project</div>
        <select className="projections__select"
          onChange={event => event && this.setState({ maxRange: event.target.value })}>
          {range(1, 10).map(value => {
            return <option value={value} selected={value === maxRange}>{value}</option>
          })}
      </select>
      </div>
      <hr />
      {!predictions && <div>No Predictions</div>}
      {predictions && !predictions.length && <div>Loading</div>}
      {predictions && predictions.length && this.renderChart()}
    <hr />
    </div>);
  }
}

export default ProjectionsHW;

import React, { Component } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import moment from 'moment';
import { isEqual, range } from 'lodash';

import CountryDataRow from '../types/CountryDataRow';
import ProjectionsProps from '../types/ProjectionsProps';
import options from '../helpers/charts';
import './Projections.scss';

let forecast = require('nostradamus');

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

  getSeries = () => {
    const { data } = this.props;
    const { predictions, period, ySlc } = this.state;

    let series: any = [];
    let dateSize = (data.length >= 2 &&
      data[0].Date &&
      data[1].Date &&
      (moment(data[1].Date).valueOf() - moment(data[0].Date).valueOf())) || 0;
    const offset = data.length % period;

    // @ts-ignore
    let typeSeries = data.map((row: CountryDataRow) => [moment(row.Date).valueOf(), row[ySlc]]);
    let date = typeSeries?.[0]?.[0];

    let predicted = predictions.map((value: number, index: number) => {
      const typeIndex = index + offset;
      if (typeIndex < data.length) {
        date = typeSeries[typeIndex][0];
      } else {
        date += dateSize
      }

      return [date, value];
    });

    series.push({ type: 'area', name: ySlc, data: typeSeries });
    series.push({ type: 'line', name: `Predicted ${ySlc}`, data: predicted, color: '#FF00FF' })

    return series;
  }

  renderChart() {
    const { width } = this.props;

    const plotOptions = {
      ...options,
      chart: { ...options.chart, width },
      series: this.getSeries()
    };

    return (<HighchartsReact highcharts={Highcharts} options={plotOptions} />);
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

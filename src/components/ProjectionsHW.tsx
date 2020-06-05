import React, { Component } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import moment from 'moment';
import { isEqual } from 'lodash';

import CountryDataRow from '../types/CountryDataRow';
import ProjectionsProps from '../types/ProjectionsProps';
import options from '../helpers/charts';
import './Projections.scss';


let forecast = require('nostradamus');

class ProjectionsHW extends Component<ProjectionsProps, any> {
  state = {
    isLoading: false,
    predictions: [],
    period: 7
  }

  componentDidMount() {
    this.getPredictions();
  }

  componentDidUpdate(prevProps: ProjectionsProps) {
    if (!isEqual(prevProps.data, this.props.data)) {
      this.setState({
        isLoading: false,
        predictions: [],
        period: 7
      });

      this.getPredictions();
    }
  }


  getPredictions = (alpha = 0.95, beta = 0.4, gamma = 0.2, m = 7) => {
    const { data, type } = this.props;
    const { period } = this.state;

    const values = data.map((row: CountryDataRow) => row[type]);
    const limit = values.length % period;
    // console.log(limit);

    const valuesLimited = values.slice(limit);

    const predictions = forecast(valuesLimited, alpha, beta, gamma, period, period);
    this.setState({ predictions });
  }

  getSeries = () => {
    const { data, type } = this.props;
    const { predictions, period } = this.state;

    let series: any = [];
    let dateSize = (data.length >= 2 &&
      data[0].Date &&
      data[1].Date &&
      (moment(data[1].Date).valueOf() - moment(data[0].Date).valueOf())) || 0;
    const limit = data.length % period;

    let typeSeries = data.map((row: CountryDataRow) => [moment(row.Date).valueOf(), row[type]]);
    let date = typeSeries?.[0]?.[0];

    let predicted = predictions.map((value: number, index: number) => {
      const typeIndex = index + limit;
      if (typeIndex < data.length) {
        date = typeSeries[typeIndex][0];
      } else {
        date += dateSize
      }

      return [date, value];
    });

    series.push({ type: 'area', name: type, data: typeSeries });
    series.push({ type: 'line', name: `Predicted ${type}`, data: predicted, color: '#FF00FF' })

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

  render() {
    const { predictions } = this.state;

    return (
    <div className="projections">
      <h3>Projections using Holt-Winters</h3>
      {!predictions && <div>No Predictions</div>}
      {predictions && !predictions.length && <div>Loading</div>}
      {predictions && predictions.length && this.renderChart()}
    <hr />
    </div>);
  }
}

export default ProjectionsHW;

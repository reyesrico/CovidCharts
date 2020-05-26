import React, { Component } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import moment from 'moment';
import { isEqual, isEmpty } from 'lodash';

import options from '../helpers/charts';
import { MakeChartProps, CountryDataRow } from '../types/types';

import './MakeChart.scss';

// Highcharts React wrapper
// https://www.highcharts.com/blog/tutorials/highcharts-react-wrapper/

class MakeChart extends Component<MakeChartProps, any> {
  state = {
    series: {},
    yValues: {
      Confirmed: true,
      Deaths: false,
      Recovered: false,
      ConfirmedInc: false,
      DeathsInc: false,
      RecoveredInc: false  
    }
  }

  componentDidMount() {
    this.getData();
  }

  componentDidUpdate(prevProps: MakeChartProps, prevState: any) {
    const { yValues } = this.state;
    if (!isEqual(prevState.yValues, yValues)) {
      
      if(this.yValuesFalse()) {
        this.clearYValues();
      } else {
        this.getData();
      }
    }
  }

  clearYValues = () => {
    let yValues: any = {};

    Object.keys(this.state.yValues).forEach(yValue => {
      const value = yValue === 'Confirmed' ? true : false;
      yValues = { ...yValues, [yValue]: value };
    });

    this.setState({ yValues });
  }

  yValuesFalse = () => {
    const res = Object.values(this.state.yValues).reduce((acc: boolean, val: boolean) => {
      return acc || val;
    });

    return !res;
  }

  changeInput(yValue: string) {
    // @ts-ignore
    const value: any = this.state.yValues[yValue];

    const yValues: { [key: string]: boolean } = { ...this.state.yValues };
    yValues[yValue] = !value;

    this.setState({ yValues });
  }

  renderOptions = () => {
    const { yValues } = this.state;
   
    return (
      <div className="make-chart__options">
        <div className="make-chart__values">Values (Y Axis)</div>
        {Object.keys(yValues).map(yValue => {
          // @ts-ignore
          const checked = yValues[yValue];
          return (
            <div>
              <input checked={checked} type="checkbox" name="yaxis" value={yValue} id={yValue}
                onChange={event => event && this.changeInput(yValue)}/>
              {yValue}
            </div>);
        })}
      </div>
    )
  }

  getData = () => {
    const { data } = this.props;
    const { yValues } = this.state;

    if (!this.yValuesFalse()) {
      let confirmed: any = [];
      let deaths: any = [];
      let recovered: any = [];
      let confirmedInc: any = [];
      let deathsInc: any = [];
      let recoveredInc: any = [];

      data.forEach((row: CountryDataRow, index: number) => {
        yValues.Confirmed && confirmed.push([moment(row.Date).valueOf(), row.Confirmed]);
        yValues.Deaths && deaths.push([moment(row.Date).valueOf(), row.Deaths]);
        yValues.Recovered && recovered.push([moment(row.Date).valueOf(), row.Recovered]);

        // Incrementals
        if (index === 0) {
          yValues.ConfirmedInc && confirmedInc.push([moment(row.Date).valueOf(), 0]);
          yValues.DeathsInc && deathsInc.push([moment(row.Date).valueOf(), 0]);
          yValues.RecoveredInc && recoveredInc.push([moment(row.Date).valueOf(), 0]);
        } else {
          let lastRow = data[index-1];
          yValues.ConfirmedInc && confirmedInc.push([moment(row.Date).valueOf(), row.Confirmed - lastRow.Confirmed]);
          yValues.DeathsInc && deathsInc.push([moment(row.Date).valueOf(), row.Deaths - lastRow.Deaths]);
          yValues.RecoveredInc && recoveredInc.push([moment(row.Date).valueOf(), row.Recovered - lastRow.Recovered]);  
        }
      });

      let series = [];
      yValues.Confirmed && series.push({ type: 'area', name: 'Confirmed', data: confirmed });
      yValues.Deaths && series.push({ type: 'area', name: 'Deaths', data: deaths });
      yValues.Recovered && series.push({ type: 'area', name: 'Recovered', data: recovered });
      yValues.ConfirmedInc && series.push({ type: 'area', name: 'ConfirmedInc', data: confirmedInc });
      yValues.DeathsInc && series.push({ type: 'area', name: 'DeathsInc', data: deathsInc });
      yValues.RecoveredInc && series.push({ type: 'area', name: 'RecoveredInc', data: recoveredInc });

      this.setState({ series });  
    } 
  }

  renderChart = () => {
    const { width } = this.props;
    const { series } = this.state;
    const plotOptions = {
      ...options,
      chart: { ...options.chart, width },
      series
    };

    if (!isEmpty(series)) {
      return (<HighchartsReact highcharts={Highcharts} options={plotOptions} />);
    }
  }

  render() {
    return (
      <div className="make-chart">
        {this.renderOptions()}
        <hr />
        {this.renderChart()}
      </div>
    );
  }
}

export default MakeChart;

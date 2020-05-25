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
    yName: '',
    yConfirmed: true,
    yDeaths: false,
    yRecovered: false
  }

  componentDidMount() {
    this.getData();
  }

  componentDidUpdate(prevProps: MakeChartProps, prevState: any) {
    const { yConfirmed, yDeaths, yRecovered } = this.state;
    if (!isEqual(prevState.yConfirmed, yConfirmed) ||
        !isEqual(prevState.yDeaths, yDeaths) || 
        !isEqual(prevState.yRecovered, yRecovered)) {
      
      if(!yConfirmed && !yDeaths && !yRecovered) {
        this.setState({ yConfirmed: true });
      } else {
        this.getData();
      }
    }
  }

  renderOptions = () => {
    return (
      <div className="make-chart__options">
        <div className="make-chart__values">Values (Y Axis)</div>
        <div><input checked={this.state.yConfirmed} type="checkbox" name="yaxis" value="Confirmed" id="Confirmed" onChange={event => event && this.setState({ yConfirmed: !this.state.yConfirmed })}/>Confirmed</div>
        <div><input type="checkbox" name="yaxis" value="Deaths" id="Deaths" onChange={event => event && this.setState({ yDeaths: !this.state.yDeaths })}/>Deaths</div>
        <div><input type="checkbox" name="yaxis" value="Recovered" id="Recovered" onChange={event => event && this.setState({ yRecovered: !this.state.yRecovered })}/>Recovered</div>
      </div>
    )
  }

  getData = () => {
    const { data } = this.props;
    const { yConfirmed, yDeaths, yRecovered } = this.state;

    if (yConfirmed || yDeaths || yRecovered) {
      let confirmed: any = [];
      let deaths: any = [];
      let recovered: any = [];

      data.forEach((row: CountryDataRow) => {
        yConfirmed && confirmed.push([moment(row.Date).valueOf(), row.Confirmed]);
        yDeaths && deaths.push([moment(row.Date).valueOf(), row.Deaths]);
        yRecovered && recovered.push([moment(row.Date).valueOf(), row.Recovered]);
      });

      let series = [];
      yConfirmed && series.push({ type: 'area', name: 'Confirmed', data: confirmed });
      yDeaths && series.push({ type: 'area', name: 'Deaths', data: deaths });
      yRecovered && series.push({ type: 'area', name: 'Recovered', data: recovered });

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

import React, { Component } from 'react';
import { isEqual } from 'lodash';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

import ChartOptions from './ChartOptions';
import { CountryDataRow, CompareChartProps } from '../types/types';
import { getCountry } from '../helpers/Service';
import { updateDates } from '../helpers/CovidHelper';

import './CompareChart.scss';

class CompareChart extends Component<CompareChartProps, any> {
  state = {
    isLoading: false,
    countryData: [],
    yValues: [
      { value: 'Confirmed', text: 'Confirmed' }, 
      { value: 'Deaths', text: 'Deaths' },
      { value: 'Recovered', text: 'Recovered' }, 
      { value: 'Active', text: 'Active' },
    ],
    selectedY: 'Confirmed'
  }

  componentDidMount() {
    this.getCountryInfo();
  }

  componentDidUpdate(prevProps: CompareChartProps, prevState: any) {
    const { countryCompare } = this.props;

    if (!isEqual(prevProps.countryCompare, countryCompare)) {
      this.getCountryInfo();
    }
  }

  getCountryInfo = () => {
    const { countryCompare, hasProvinces } = this.props;
    this.setState({ countryData: [] });

    if (!hasProvinces) {
      this.setState({ isLoading: true });

      getCountry(countryCompare.value)
      .then(res => this.setState({ countryData: res.data }))
      .finally(() => this.setState({ isLoading: false }));
    }
  }


  getData = () => {
    const { data, countryCompare } = this.props;
    const { countryData, selectedY } = this.state;

    let series: any = [];

    if(data.length && countryData.length) {
      let map: any = {};

      countryData.forEach((row: CountryDataRow) => {
        map = { ...map, [row.Date]: row };
      });

      series = data.map((row: CountryDataRow) => {
        let otherCountry: CountryDataRow = map[row.Date];

        return {
          // @ts-ignore
          [row.Country]: row[selectedY],
          // @ts-ignore
          [countryCompare.label]: otherCountry ? otherCountry[selectedY] : 0,
          Date: row.Date
        };
      });
    }

    return series;
  }


  renderChart = () => {
    const { width } = this.props;
    let data = this.getData();

    if (!data || !data.length) return <div>Data no available</div>;

    data = updateDates(data);
    let keys = Object.keys(data[0]);

    return (
      <AreaChart width={width} height={250} data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="color1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="color2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="Date" />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Area type="monotone" dataKey={keys[0]} stroke="#82ca9d" fillOpacity={1} fill="url(#color1)" />
        <Area type="monotone" dataKey={keys[1]} stroke="#8884d8" fillOpacity={1} fill="url(#color2)" />
      </AreaChart>);
  }

  renderOptions = () => {
    const { yValues, selectedY } = this.state;
   
    return (
      <div className="compare-chart__options">
        <div className="compare-chart__values">Values (Y Axis)</div>
        <ChartOptions options={yValues} selected={selectedY}
          onChange={(event: any) => event && this.setState({ selectedY: event.target.value })} />
      </div>
    )
  }

  render() {
    const { hasProvinces } = this.props;

    if (hasProvinces) return <div>Country not available to compare</div>;

    return (
      <div className="compare-chart">
        {this.renderOptions()}
        <hr />
        {this.renderChart()}
      </div>
    )
  }
}

export default CompareChart;
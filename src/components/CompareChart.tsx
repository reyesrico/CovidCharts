import React, { Component } from 'react';
import { isEqual } from 'lodash';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import ChartOptions from './ChartOptions';
import CompareChartProps from '../types/CompareChartProps';
import CountryDataRow from '../types/CountryDataRow';
import { getCountryByDateRange } from '../helpers/Service';
import { getDaysAgoDate, formatDate } from '../helpers/DateHelper';

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
    const { countryCompare, timeRange } = this.props;

    if (!isEqual(prevProps.countryCompare, countryCompare) ||
        prevProps.timeRange !== timeRange) {
      this.getCountryInfo();
    }
  }

  getCountryInfo = () => {
    const { countryCompare, hasProvinces, timeRange } = this.props;
    this.setState({ countryData: [] });

    if (!hasProvinces) {
      this.setState({ isLoading: true });

      const dateTo = formatDate(new Date());
      const dateFrom = timeRange === 'all'
        ? '2020-01-22'
        : formatDate(getDaysAgoDate(parseInt(timeRange, 10)));

      getCountryByDateRange(countryCompare.value, dateFrom, dateTo)
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
    let data = this.getData();

    if (!data || !data.length) return <div>Data not available</div>;

    let keys = Object.keys(data[0]);

    return (
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
import React, { Component } from 'react';
import Select from 'react-select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { isEqual, sortBy } from 'lodash';

import CompareChart from './components/CompareChart';
import CountryDataRow from './types/CountryDataRow';
import CovidPredictions from './components/CovidPredictions';
import Footer from './components/Footer';
import Instructions from './components/Instructions';
import Loading from './components/Loading';
import MakeChart from './components/MakeChart';
import Projections from './components/Projections';
import ProjectionsHW from './components/ProjectionsHW';
import { hasProvince, hasCity, createMap, getUniqueCities, getCityData, manageCountryData, getProvinces, updateDates } from './helpers/CovidHelper';
import { getCountry, getCountries } from './helpers/Service';

import './App.scss';

class App extends Component<any, any> {
  state = {
    defaultCountrySlug: localStorage.getItem('country') || 'mexico',
    menu: { 'fn': null },
    all: null,
    country: [],
    countryData: [],
    countries: [],
    countrySelected: { name: null, Country: '', value: '', label: null },
    countryCompare: { name: null, Country: '', value: '', label: null },
    isLoading: false,
    provinces: [],
    provinceData: [],
    provinceSelected: { name: null, value: '', label: null },
    cities: [],
    citySelected: { name: null, value: '', label: null },
    usMap: {},
    isError: false,
    width: 500
  }

  componentDidMount() {
    const { defaultCountrySlug } = this.state;
    const windowWidth = window.innerWidth;
    const width = windowWidth >= 500 ? 500 : (windowWidth * 0.8);

    getCountries().then((res: any) => {
      let sorted = sortBy(res.data, ['Slug']);
      let id = 0;
      let countries = sorted.map((row: any, index: number) => {
        if (row.Slug === defaultCountrySlug) {
          id = index;
        }
        return { ...row, value: row.Slug, label: row.Country, name: row.Slug };
      });

      this.setState({ countries, countrySelected: countries[id], countryCompare: countries[81], width });
    });
  }

  componentDidUpdate(prevProps: any, prevState: any) {
    if (this.state.isError) {
      this.getCountryInfo();
    } else if (!this.state.isLoading) {
      if (!isEqual(prevState.countrySelected, this.state.countrySelected)) {
        this.getCountryInfo();
      } else {
        if (!isEqual(prevState.provinceSelected, this.state.provinceSelected)) {
          if (hasCity(this.state.country)) {
            let cities = getUniqueCities(this.state.usMap, this.state.provinceSelected);
            this.setState({ cities, citySelected: cities[0] });
          }
        }
      }
    }
  }

  getCountryInfo = () => {
    const { countrySelected } = this.state;

    this.setState({ isLoading: true, isError: false });

    getCountry(countrySelected.value)
      .then(res => {
        const country = res.data;
        let usMap, provinces, provinceSelected, cities, citySelected;

        if (hasProvince(country)) {
          usMap = createMap(country);
          provinces = getProvinces(usMap);
          provinceSelected = provinces[0];

          if (hasCity(country)) {
            cities = getUniqueCities(usMap, provinceSelected);
            citySelected = cities[0];
          }

          this.setState({ usMap, country, cities, provinces, provinceSelected, citySelected });
        } else {
          this.setState({
            country,
            usMap: {},
            provinceSelected: { name: null },
            provinces: [],
            provinceData: [],
            citySelected: { name: null },
            cities: []
          });
        }
      })
      .catch(() => this.setState({ isError: true }))
      .finally(() => this.setState({ isLoading: false }));
  }

  getData = (country: CountryDataRow[], managed: boolean = false, changeDates: boolean = true) => {
    const { usMap, citySelected, provinceSelected } = this.state;

    let data = hasCity(country) ? getCityData(usMap, provinceSelected, citySelected) :
      // @ts-ignore
      hasProvince(country) ? usMap[provinceSelected.label] :
        country;

    data = changeDates ? updateDates(data) : data;

    return managed ? manageCountryData(data) : data;
  }

  renderChart(country: CountryDataRow[], managed: boolean = false, compare: boolean = true) {
    const { width } = this.state;

    let data = this.getData(country, managed);

    if (!data || !data.length) return <div>No data</div>;

    return (
      <AreaChart width={width} height={250} data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorDeaths" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorConfirmed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="Date" />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Area type="monotone" dataKey="Confirmed" stroke="#82ca9d" fillOpacity={1} fill="url(#colorConfirmed)" />
        <Area type="monotone" dataKey="Deaths" stroke="#8884d8" fillOpacity={1} fill="url(#colorDeaths)" />
      </AreaChart>
    );
  }

  renderCompareChart(countryHasProvince: boolean) {
    const { country, countries, countryCompare, width} = this.state;
    return (
      <div className="covid__chart">
        <h3 className="covid__chart-text">Compare with other country</h3>
        <div className="covid__chart-select">
          <Select onChange={(countryCompare: any) => this.setState({ countryCompare })} options={countries} value={countryCompare} />
        </div>
        {country.length && <CompareChart data={this.getData(country, false, false)} width={width} countryCompare={countryCompare} hasProvinces={countryHasProvince} />}
      </div>
    );
  }
  
  renderTitle = () => {
    const { citySelected, provinceSelected, countrySelected } = this.state;
    return citySelected?.label ?? provinceSelected?.label  ?? countrySelected.label;
  }

  render() {
    const { country, countries, countrySelected, isLoading, provinces,
      provinceSelected, cities, citySelected, usMap, width, isError } = this.state;

    let countryText = countrySelected.label ?? 'Country';
    if (!countries.length || isLoading) return (<Loading size="xl" message={`Loading ${countryText} Data`} />);

    let countryHasProvince = hasProvince(country);
    let countryHasCity = hasCity(country);

    return (
      <div className="covid">
        <h2 className="covid__title">COVID {countrySelected.label} Charts</h2>
        <h3 className="covid__subtitle">Data Source: <a href="https://github.com/CSSEGISandData/COVID-19">Johns Hopkins CSSE</a></h3>
        <Instructions countrySelected={countrySelected} />
        {isError && <div className="covid__error">Error Getting Data: Try Again</div>}
        <div className="covid__dropdowns">
          <Select onChange={(countrySelected: any) => this.setState({ countrySelected })} options={countries} value={countrySelected} />
          {countryHasProvince && <Select onChange={(provinceSelected: any) => this.setState({ provinceSelected })} options={provinces} value={provinceSelected} />}
          {countryHasCity && <Select onChange={(citySelected: any) => this.setState({ citySelected })} options={cities} value={citySelected} />}
        </div>
        <hr />
        <div className="covid__charts">
          <h3 className="covid__chart-text">Total Confirmed and Deaths</h3>
          {this.renderChart(country)}
          <hr />
          <h3 className="covid__chart-text">Incremental Confirmed (To Date - One Day Before) and Deaths</h3>
          {this.renderChart(country, true)}
          <hr />
          {!countryHasProvince && this.renderCompareChart(countryHasProvince)}
          <hr />
          <h3 className="covid__chart-text">Make Your Own {this.renderTitle()} Chart</h3>
          <MakeChart countries={countries} data={this.getData(country, false, false)} map={usMap} width={width} />
          <hr />
          <div className="covid__texts">
            <div className="covid__text">{countrySelected.label}</div>
            {countryHasProvince && <div className="covid__text">{provinceSelected?.label}</div>}
            {countryHasCity && <div className="covid__text">{citySelected?.label}</div>}
          </div>
          <hr />
          {/* <h3 className="covid__chart-text">Covid Preditions (based on StockPredictions)</h3>
          {country.length && <CovidPredictions data={this.getData(country, false, false)} type="Confirmed" width={width} />} */}
          <hr />
          <h3 className="covid__chart-text">Confirmed Type Projections Holt-Winter</h3>
          {country.length && <ProjectionsHW data={this.getData(country, false, false)} type="Confirmed" width={width} />}
          <hr />
          <h3 className="covid__chart-text">Confirmed Type Projections</h3>
          {country.length && <Projections data={this.getData(country, false, false)} type="Confirmed" width={width} />}
        </div>
        <Footer />
      </div>
    );
  }
}

export default App;

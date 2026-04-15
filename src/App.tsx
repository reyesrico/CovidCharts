import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { sortBy } from 'lodash';
import { useTranslation } from 'react-i18next';

import CompareChart from './components/CompareChart';
import CountryDataRow from './types/CountryDataRow';
import CovidPredictions from './components/CovidPredictions';
import Footer from './components/Footer';
import Instructions from './components/Instructions';
import LanguageSwitcher from './components/LanguageSwitcher';
import Loading from './components/Loading';
import MakeChart from './components/MakeChart';
import StatsCards from './components/StatsCards';
import ChartSkeleton from './components/ChartSkeleton';
// import Projections from './components/Projections';
import ProjectionsHW from './components/ProjectionsHW';
import { hasProvince, hasCity, createMap, getUniqueCities, getCityData, manageCountryData, getProvinces, updateDates } from './helpers/CovidHelper';
import { getCountries, getCountryByDateRange } from './helpers/Service';
import { getDaysAgoDate, formatDate } from './helpers/DateHelper';
import TimeRangeSelector from './components/TimeRangeSelector';
import TimeRange from './types/TimeRange';

import './App.scss';

const SELECT_STYLES = {
  container:   (base: any) => ({ ...base, width: '100%' }),
  singleValue: (base: any) => ({ ...base, color: '#212529' }),
  input:       (base: any) => ({ ...base, color: '#212529' }),
  placeholder: (base: any) => ({ ...base, color: '#6C757D' }),
  option: (base: any, state: any) => ({
    ...base,
    color: state.isSelected ? '#fff' : '#212529',
    backgroundColor: state.isSelected ? '#457B9D' : state.isFocused ? '#e8f4f8' : '#fff',
  }),
};

const App: React.FC = () => {
  const { t } = useTranslation();

  // Read saved defaults (support both old 'country' key and new 'defaultCountry')
  const defaultCountrySlug   = localStorage.getItem('defaultCountry') || localStorage.getItem('country') || 'mex';
  const defaultProvinceLabel = localStorage.getItem('defaultProvince') || null;

  const [country, setCountry] = useState<CountryDataRow[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [countrySelected, setCountrySelected] = useState<any>({ name: null, Country: '', value: '', label: null });
  const [countryCompare, setCountryCompare] = useState<any>({ name: null, Country: '', value: '', label: null });
  const [isLoading, setIsLoading] = useState(false);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [provinceData, setProvinceData] = useState<any[]>([]);
  const [provinceSelected, setProvinceSelected] = useState<any>({ name: null, value: '', label: null });
  const [cities, setCities] = useState<any[]>([]);
  const [citySelected, setCitySelected] = useState<any>({ name: null, value: '', label: null });
  const [usMap, setUsMap] = useState<any>({});
  const [isError, setIsError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [timeRange, setTimeRange] = useState<TimeRange>('90');

  // In-memory cache: countrySlug → { map, provinces }  for fast re-navigation
  const stateCache = useRef<Record<string, { map: any; provinces: any[] }>>({});

  // Load countries on mount
  useEffect(() => {
    let mounted = true;
    getCountries().then((res: any) => {
      if (!mounted) return;
      const sorted = sortBy(res.data, ['Slug']);
      let id = 0;
      const loadedCountries = sorted.map((row: any, index: number) => {
        // match by ISO slug or by country name (handles old localStorage values like 'mexico')
        if (
          row.Slug === defaultCountrySlug ||
          row.Country?.toLowerCase() === defaultCountrySlug.toLowerCase()
        ) id = index;
        return { ...row, value: row.Slug, label: row.Country, name: row.Slug };
      });
      setCountries(loadedCountries);
      setCountrySelected(loadedCountries[id]);
      setCountryCompare(loadedCountries[81]);
    });
    return () => { mounted = false; };
  }, []);

  // Fetch country data when selection or time range changes
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!countrySelected.value) return;
    // Cancel any in-flight request before starting a new one
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    getCountryInfo();
    return () => { abortRef.current?.abort(); };
  }, [countrySelected, timeRange]);

  // Retry on error
  useEffect(() => {
    if (isError && retryCount < 3) {
      getCountryInfo(true);
    }
  }, [isError, retryCount]);

  // Update cities when province selection changes
  useEffect(() => {
    if (hasCity(country) && provinceSelected?.name) {
      const newCities = getUniqueCities(usMap, provinceSelected);
      setCities(newCities);
      setCitySelected(newCities[0]);
    }
  }, [provinceSelected]);

  const getCountryInfo = (isRetry: boolean = false) => {
    setIsLoading(true);
    setIsError(false);
    setRetryCount(prev => isRetry ? prev + 1 : 0);

    // API data only exists through 2023-03-09 — anchor ranges to that date, not today
    const DATA_END = '2023-03-09';
    const dateTo = DATA_END;
    const dateFrom = timeRange === 'all'
      ? '2020-01-22'
      : formatDate(getDaysAgoDate(parseInt(timeRange, 10), new Date(DATA_END)));

    const signal = abortRef.current?.signal;
    getCountryByDateRange(countrySelected.value, dateFrom, dateTo)
      .then(res => {
        if (signal?.aborted) return;
        const loadedCountry = res.data;
        if (hasProvince(loadedCountry)) {
          const map = createMap(loadedCountry);
          const provs = getProvinces(map);

          // Cache for fast re-navigation
          stateCache.current[countrySelected.value] = { map, provinces: provs };

          // Restore saved province if this is the default country on first load,
          // otherwise fall back to first province
          const savedProv = defaultProvinceLabel
            ? provs.find((p: any) => p.label === defaultProvinceLabel) ?? provs[0]
            : provs[0];
          const provSelected = savedProv;

          if (hasCity(loadedCountry)) {
            const newCities = getUniqueCities(map, provSelected);
            setCities(newCities);
            setCitySelected(newCities[0]);
          }
          setUsMap(map);
          setCountry(loadedCountry);
          setProvinces(provs);
          setProvinceSelected(provSelected);
        } else {
          setCountry(loadedCountry);
          setUsMap({});
          setProvinceSelected({ name: null, value: '', label: null });
          setProvinces([]);
          setProvinceData([]);
          setCitySelected({ name: null, value: '', label: null });
          setCities([]);
        }
      })
      .catch((err: any) => { if (err?.name !== 'AbortError') setIsError(true); })
      .finally(() => { if (!signal?.aborted) setIsLoading(false); });
  };

  const getData = (src: CountryDataRow[], managed: boolean = false, changeDates: boolean = true): CountryDataRow[] => {
    let data: CountryDataRow[] | undefined;

    if (hasCity(src)) {
      data = getCityData(usMap, provinceSelected, citySelected);
    } else if (hasProvince(src)) {
      data = usMap[provinceSelected.label];
    } else {
      data = src;
    }

    if (!data || !data.length) return [];
    data = changeDates ? updateDates(data) : data;
    if (managed) {
      const managedData = manageCountryData(data);
      return managedData ?? [];
    }
    return data;
  };

  const renderChart = (src: CountryDataRow[], managed: boolean = false) => {
    const data = getData(src, managed);
    if (!data || !data.length) return <div>No data</div>;

    return (
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorDeaths" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E63946" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#E63946" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorConfirmed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#457B9D" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#457B9D" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="Date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Area type="monotone" dataKey="Confirmed" stroke="#457B9D" fillOpacity={1} fill="url(#colorConfirmed)" />
          <Area type="monotone" dataKey="Deaths" stroke="#E63946" fillOpacity={1} fill="url(#colorDeaths)" />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const countryHasProvince = hasProvince(country);
  const countryHasCity = hasCity(country);
  // Only compute display data once provinces/cities are settled to avoid undefined map lookups
  const isProvinceReady = !countryHasProvince || (provinces.length > 0 && provinceSelected?.label);
  const data = isProvinceReady ? getData(country, false, false) : [];
  const countryText = countrySelected.label ?? 'Country';
  const title = citySelected?.label ?? provinceSelected?.label ?? countrySelected.label;

  if (!countries.length) return <Loading size="xl" message={t('header.loadingCountries')} />;

  return (
    <div className="covid">
      <header className="covid__header">
        <div className="covid__header-title">
          <h1 className="covid__title">{t('header.title')}</h1>
          <span className="covid__disclaimer">{t('header.disclaimer')}</span>
        </div>
        <div className="covid__header-controls">
          <div className="covid__dropdowns">
            <Select styles={SELECT_STYLES} onChange={(selected: any) => setCountrySelected(selected)} options={countries} value={countrySelected} />
            {countryHasProvince && <Select styles={SELECT_STYLES} onChange={(selected: any) => setProvinceSelected(selected)} options={provinces} value={provinceSelected} />}
            {countryHasCity && <Select styles={SELECT_STYLES} onChange={(selected: any) => setCitySelected(selected)} options={cities} value={citySelected} />}
          </div>
          <div className="covid__header-right">
            <TimeRangeSelector
              value={timeRange}
              onChange={(range) => setTimeRange(range)}
              disabled={isLoading}
            />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <Instructions countrySelected={countrySelected} provinceSelected={provinceSelected} />

      {isError && (
        <div className="covid__error">
          {t('error.loading', { country: countryText })}
          <button className="covid__error-retry" onClick={() => getCountryInfo()}>{t('error.retry')}</button>
        </div>
      )}

      {country.length > 0 && <StatsCards data={data} />}

      <div className="covid__charts">
        {isLoading ? (
          <ChartSkeleton height={280} message={t('header.loadingData', { country: countryText })} />
        ) : (
          <>
            <h3 className="covid__chart-text">{t('chart.totalTitle')}</h3>
            {renderChart(country)}
            <hr />
            <h3 className="covid__chart-text">{t('chart.incrementalTitle')}</h3>
            {renderChart(country, true)}
            <hr />
            {!countryHasProvince && (
              <div className="covid__chart">
                <h3 className="covid__chart-text">{t('chart.compareTitle')}</h3>
                <div className="covid__chart-select">
                  <Select styles={SELECT_STYLES} onChange={(selected: any) => setCountryCompare(selected)} options={countries} value={countryCompare} />
                </div>
                {country.length > 0 && <CompareChart data={getData(country, false, false)} timeRange={timeRange} countryCompare={countryCompare} hasProvinces={countryHasProvince} />}
              </div>
            )}
            <hr />
            <h3 className="covid__chart-text">{t('chart.makeTitle', { title })}</h3>
            <MakeChart countries={countries} data={getData(country, false, false)} map={usMap} />
            <hr />
            <h3 className="covid__chart-text">{t('chart.projectionsTitle')}</h3>
            {data.length > 0 && <ProjectionsHW data={data} type="Confirmed" />}
            <hr />
            <h3 className="covid__chart-text">{t('chart.predictionsTitle')}</h3>
            {data.length > 0 && <CovidPredictions data={data} />}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default App;


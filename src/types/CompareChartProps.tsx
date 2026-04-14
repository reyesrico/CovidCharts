import CountryDataRow from './CountryDataRow';
import TimeRange from './TimeRange';

export default interface CompareChartProps {
  data: CountryDataRow[]
  countryCompare: any,
  hasProvinces: boolean,
  timeRange: TimeRange,
}

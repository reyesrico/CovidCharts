import CountryDataRow from './CountryDataRow';

export default interface CompareChartProps {
  width: number,
  data: CountryDataRow[]
  countryCompare: any,
  hasProvinces: boolean
}

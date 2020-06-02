import CountryDataRow from './CountryDataRow';

export default interface MakeChartProps {
  data: CountryDataRow[]
  map: any,
  countries: any[],
  width: number
}

export type CountryDataRow = {
  Active: number,
  City: string,
  CityCode: string,
  Confirmed: number,
  Country: string,
  CountryCode: string,
  Date: string,
  Deaths: number,
  Province: string,
  Recovered: number
}

export type LoadingSize = 'sm' | 'md' | 'lg' | 'xl';

export interface LoadingProps {
  size: LoadingSize,
  message?: string
}

export interface MakeChartProps {
  data: CountryDataRow[]
  map: any,
  countries: any[],
  width: number
}

export interface CompareChartProps {
  width: number,
  data: CountryDataRow[]
  countryCompare: any,
  hasProvinces: boolean
}

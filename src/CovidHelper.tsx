import moment from 'moment';
import { CountryDataRow } from "./types";

export const hasProvince = (country: CountryDataRow[]): boolean => {
  return country && country.some((row: CountryDataRow) => row.Province !== "");
}

export const hasCity = (country: CountryDataRow[]): boolean => {
  return country && country.some((row: CountryDataRow) => row.City !== "");
}

export const createMap = (country: CountryDataRow[]): any => {
  let provinces = {};

  country.forEach((row: CountryDataRow) => {
    const Province = row.Province === '' ? 'Undefined' : row.Province;
    const City = row.City === '' ? 'Undefined' : row.City;
    const newRow = { ...row, Province, City };

    let pKeys = Object.keys(provinces);

    if (pKeys.includes(newRow.Province)) {
      // @ts-ignore
      provinces[newRow.Province].push(newRow);
    } else {
      provinces = { ...provinces, [newRow.Province]: [newRow] };
    }
  });

  return provinces;
}

export const getUniqueCities = (map: any, province: any) => {
  let provinceData: any = map[province.label];

  return provinceData.map((row: CountryDataRow) => row.City)
  .filter((value: any, index: number, self: any) => self.indexOf(value) === index)
  .sort()
  .map((city: string) => {
    return { value: city, name: city, label: city };
  });
}

export const getCityData = (map: any, province: any, city: any) => {
  let provinceData: any = map[province.label];

  return provinceData.filter((row: CountryDataRow) => row.City === city.label);
}

export const manageCountryData = (country: CountryDataRow[]) => {
  if (!country.length) return;

  let row: CountryDataRow = country[0];

  let confirmedInc: number[] = [row.Confirmed];
  let dates: string[] = [moment(row.Date).format("MMM Do")];

  for(let i = 1; i < country.length; i++) {
    row = country[i];
    let lastRow: CountryDataRow = country[i-1];
    let increment = row.Confirmed - lastRow.Confirmed;
    confirmedInc[i] = increment;
    dates.push(moment(row.Date).format("MMM Do"));
  }

  let countryData = country.map((row: CountryDataRow, index: number) => {
    return { ...row, Confirmed: confirmedInc[index], Date: dates[index] }
  });

  return countryData;
}

export const getProvinces = (usMap: any) => {
  return Object.keys(usMap).sort().map((p: string) => {
    return { name: p, label: p, value: p };
  });
}

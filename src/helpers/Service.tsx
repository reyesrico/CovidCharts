import CountryDataRow from '../types/CountryDataRow';

// Johns Hopkins CSSE data ends on this date
const DATA_END_DATE = '2023-03-09';

// New COVID API endpoints (covid-api.com)
const api = {
  regions: () => `https://covid-api.com/api/regions`,
  reports: (params: string) => `https://covid-api.com/api/reports${params}`,
};

const fetchData = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data from COVID API:', error);
    throw error;
  }
};

// Map covid-api.com response to CountryDataRow format
const mapReportToCountryDataRow = (report: any): CountryDataRow => {
  const confirmed = report.confirmed || 0;
  const deaths = report.deaths || 0;
  const recovered = report.recovered || 0;
  // Prevent negative active cases
  const active = Math.max(0, confirmed - deaths - recovered);
  
  return {
    Active: active,
    City: report.region?.city || '',
    CityCode: '',
    Confirmed: confirmed,
    Country: report.region?.name || '',
    CountryCode: report.region?.iso || '',
    Date: report.date,
    Deaths: deaths,
    Lat: report.region?.lat || '0',
    Lon: report.region?.long || '0',
    Province: report.region?.province || '',
    Recovered: recovered
  };
};

export const getCountries = async () => {
  const response = await fetchData(api.regions());
  const data = response.data || [];
  
  // Map to format expected by the app
  const countries = data.map((region: any) => ({
    Country: region.name,
    Slug: region.iso.toLowerCase(),
    ISO2: region.iso
  }));
  
  return { data: countries };
};

export const getCountry = async (countryIso: string, dateFrom?: string, dateTo?: string) => {
  // Build query params
  let params = `?iso=${countryIso.toUpperCase()}`;
  
  if (dateFrom) {
    params += `&date=${dateFrom}`;
  }
  
  const response = await fetchData(api.reports(params));
  const reports = response.data || [];
  
  // If we have a date range, we need to fetch multiple days
  if (dateFrom && dateTo) {
    return getCountryByDateRange(countryIso, dateFrom, dateTo);
  }
  
  // Map reports to CountryDataRow format
  const countryData = reports.map(mapReportToCountryDataRow);
  
  return { data: countryData };
};

export const getCountryByDateRange = async (countryIso: string, dateFrom: string, dateTo: string) => {
  // Cap the end date — data only exists through DATA_END_DATE
  const effectiveTo = dateTo > DATA_END_DATE ? DATA_END_DATE : dateTo;

  const startDate = new Date(dateFrom);
  const endDate   = new Date(effectiveTo);
  const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);

  // Choose step so total requests stay ≤ ~50
  let stepDays = 1;
  if      (totalDays > 600) stepDays = 20;
  else if (totalDays > 300) stepDays = 10;
  else if (totalDays > 120) stepDays = 7;
  else if (totalDays > 50)  stepDays = 4;
  else if (totalDays > 20)  stepDays = 2;

  const datesToFetch: string[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    datesToFetch.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + stepDays);
  }
  // Always include the last available date for accurate end-point
  if (!datesToFetch.includes(effectiveTo)) datesToFetch.push(effectiveTo);

  const promises = datesToFetch.map(dateStr => {
    const params = `?iso=${countryIso.toUpperCase()}&date=${dateStr}`;
    return fetchData(api.reports(params))
      .then(response => {
        const reports = response.data || [];
        return reports.map(mapReportToCountryDataRow);
      })
      .catch(() => [] as CountryDataRow[]);
  });

  const results = await Promise.all(promises);
  const allReports: CountryDataRow[] = [];
  results.forEach(reports => allReports.push(...reports));

  // Sort chronologically and remove any empty/duplicate dates
  allReports.sort((a, b) => a.Date.localeCompare(b.Date));

  return { data: allReports };
};


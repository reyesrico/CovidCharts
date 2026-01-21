import CountryDataRow from '../types/CountryDataRow';

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
  const allReports: CountryDataRow[] = [];
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);
  
  // Build array of dates to fetch
  const datesToFetch: string[] = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    datesToFetch.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Fetch all dates in parallel for better performance
  const promises = datesToFetch.map(dateStr => {
    const params = `?iso=${countryIso.toUpperCase()}&date=${dateStr}`;
    return fetchData(api.reports(params))
      .then(response => {
        const reports = response.data || [];
        return reports.map(mapReportToCountryDataRow);
      })
      .catch(error => {
        console.error(`Error fetching data for ${dateStr}:`, error);
        return [];
      });
  });
  
  const results = await Promise.all(promises);
  results.forEach(reports => allReports.push(...reports));
  
  return { data: allReports };
};

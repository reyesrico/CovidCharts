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
  return {
    Active: report.confirmed - report.deaths - report.recovered,
    City: report.region?.city || '',
    CityCode: '',
    Confirmed: report.confirmed || 0,
    Country: report.region?.name || '',
    CountryCode: report.region?.iso || '',
    Date: report.date,
    Deaths: report.deaths || 0,
    Lat: report.region?.lat || '0',
    Lon: report.region?.long || '0',
    Province: report.region?.province || '',
    Recovered: report.recovered || 0
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
  
  // Fetch data for each day in the range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const params = `?iso=${countryIso.toUpperCase()}&date=${dateStr}`;
    
    try {
      const response = await fetchData(api.reports(params));
      const reports = response.data || [];
      const mappedReports = reports.map(mapReportToCountryDataRow);
      allReports.push(...mappedReports);
    } catch (error) {
      console.error(`Error fetching data for ${dateStr}:`, error);
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return { data: allReports };
};

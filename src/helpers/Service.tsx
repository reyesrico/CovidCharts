const headers = {
    'cache-control': 'no-cache',
    'x-apikey': '5c932ad1cac6621685acc11e'
};

const api = {
  default: () => `https://api.covid19api.com/`,
  all: () => `https://api.covid19api.com/all`,
  countries: () => `https://api.covid19api.com/countries`,
  country: (country: string) => `https://api.covid19api.com/dayone/country/${country}`,  
};

const fetchWithHeaders = async (url: string) => {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return { data };
};

export const getDefault = () => (
  fetchWithHeaders(api.default())
);

export const getAll = () => (
  fetchWithHeaders(api.all())
);

export const getCountry = (country: string) => (
  fetchWithHeaders(api.country(country))
);

export const getCountries = () => (
  fetchWithHeaders(api.countries())
);

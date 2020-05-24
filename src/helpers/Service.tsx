import axios from 'axios';

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

export const getDefault = () => (
  axios.get(api.default(), { headers })
);

export const getAll = () => (
  axios.get(api.all(), { headers })
);

export const getCountry = (country: string) => (
  axios.get(api.country(country), { headers })
);

export const getCountries = () => (
  axios.get(api.countries(), { headers })
);

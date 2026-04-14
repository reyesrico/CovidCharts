import React from 'react';
import CountryDataRow from '../types/CountryDataRow';
import './StatsCards.scss';

interface StatsCardsProps {
  data: CountryDataRow[];
}

const fmt = (n: number) => n.toLocaleString();

const StatsCards: React.FC<StatsCardsProps> = ({ data }) => {
  if (!data.length) return null;

  const latest = data[data.length - 1];
  const prev   = data.length > 1 ? data[data.length - 2] : latest;

  const newCases  = Math.max(0, latest.Confirmed - prev.Confirmed);
  const newDeaths = Math.max(0, latest.Deaths    - prev.Deaths);

  const cards = [
    { label: 'Total Confirmed', value: fmt(latest.Confirmed), color: 'blue',   sub: `+${fmt(newCases)} latest`   },
    { label: 'Total Deaths',    value: fmt(latest.Deaths),    color: 'red',    sub: `+${fmt(newDeaths)} latest`   },
    { label: 'Recovered',       value: fmt(latest.Recovered), color: 'green',  sub: null                          },
    { label: 'Active',          value: fmt(latest.Active),    color: 'orange', sub: null                          },
  ];

  return (
    <div className="stats-cards">
      {cards.map(({ label, value, color, sub }) => (
        <div key={label} className={`stats-cards__card stats-cards__card--${color}`}>
          <div className="stats-cards__label">{label}</div>
          <div className="stats-cards__value">{value}</div>
          {sub && <div className="stats-cards__sub">{sub}</div>}
        </div>
      ))}
    </div>
  );
};

export default StatsCards;

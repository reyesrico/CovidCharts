import React from 'react';
import { useTranslation } from 'react-i18next';
import CountryDataRow from '../types/CountryDataRow';
import './StatsCards.scss';

interface StatsCardsProps {
  data: CountryDataRow[];
}

const fmt = (n: number) => n.toLocaleString();

const StatsCards: React.FC<StatsCardsProps> = ({ data }) => {
  const { t } = useTranslation();
  if (!data.length) return null;

  const latest = data[data.length - 1];
  const prev   = data.length > 1 ? data[data.length - 2] : latest;

  const newCases  = Math.max(0, latest.Confirmed - prev.Confirmed);
  const newDeaths = Math.max(0, latest.Deaths    - prev.Deaths);

  const cards = [
    { label: t('stats.confirmed'), value: fmt(latest.Confirmed), color: 'blue',   sub: t('stats.latest', { n: fmt(newCases) })   },
    { label: t('stats.deaths'),    value: fmt(latest.Deaths),    color: 'red',    sub: t('stats.latest', { n: fmt(newDeaths) })   },
    { label: t('stats.recovered'), value: fmt(latest.Recovered), color: 'green',  sub: null                                        },
    { label: t('stats.active'),    value: fmt(latest.Active),    color: 'orange', sub: null                                        },
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

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n';
import './LanguageSwitcher.scss';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0];

  const select = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('lang', code);
    // RTL support for Arabic
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Apply RTL on mount if Arabic is saved
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, []);

  return (
    <div className="lang-switcher" ref={ref}>
      <button className="lang-switcher__toggle" onClick={() => setOpen(o => !o)}>
        <span className="lang-switcher__flag">{current.flag}</span>
        <span className="lang-switcher__name">{current.label}</span>
        <span className="lang-switcher__arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ul className="lang-switcher__menu">
          {LANGUAGES.map(l => (
            <li
              key={l.code}
              className={`lang-switcher__item${l.code === i18n.language ? ' lang-switcher__item--active' : ''}`}
              onClick={() => select(l.code)}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher;

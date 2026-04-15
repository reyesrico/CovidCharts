import React from 'react';
import { useTranslation } from 'react-i18next';
import './Footer.scss';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  return (
    <footer className="footer">
      <div className="footer__inner">
        {/* Branding */}
        <div className="footer__brand">
          <span className="footer__logo">CovidCharts</span>
          <span className="footer__tagline">{t('footer.codedBy')} <a href="http://stuffie.azurewebsites.net/PM_Carlos-Reyes2.html" target="_blank" rel="noopener noreferrer">Carlos Reyes-Rico</a></span>
        </div>

        {/* Links */}
        <div className="footer__links">
          <a className="footer__link" href="https://github.com/reyesrico/CovidCharts" target="_blank" rel="noopener noreferrer">
            <svg className="footer__icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
            GitHub
          </a>
          <a className="footer__link" href="https://twitter.com/reyesrico" target="_blank" rel="noopener noreferrer">
            <svg className="footer__icon" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            @reyesrico
          </a>
          <a className="footer__link" href="https://covid-api.com" target="_blank" rel="noopener noreferrer">
            <svg className="footer__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            covid-api.com
          </a>
          <a className="footer__link" href="https://github.com/reyesrico/CovidCharts/blob/master/README.md" target="_blank" rel="noopener noreferrer">
            <svg className="footer__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            {t('footer.why')}
          </a>
        </div>

        {/* Data note */}
        <div className="footer__note">
          <span>📊 Data: Johns Hopkins CSSE — through Mar 9, 2023</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

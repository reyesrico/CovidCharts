import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Instructions.scss';

interface InstructionsProps {
  countrySelected: any;
  provinceSelected: any;
}

const Instructions: React.FC<InstructionsProps> = ({ countrySelected, provinceSelected }) => {
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (countrySelected?.value) {
      localStorage.setItem('defaultCountry', countrySelected.value);
    }
    if (provinceSelected?.label) {
      localStorage.setItem('defaultProvince', provinceSelected.label);
    } else {
      localStorage.removeItem('defaultProvince');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const steps = [
    t('instructions.step1'),
    t('instructions.step2'),
    t('instructions.step3'),
  ];

  return (
    <div className="instructions">
      <div className="instructions__inner">
        <div className="instructions__steps-wrap">
          <h4 className="instructions__title">{t('instructions.title')}</h4>
          <ol className="instructions__list">
            {steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <p className="instructions__tip">
            <span className="instructions__tip-icon">💡</span>
            {t('instructions.tip')}
          </p>
        </div>

        <div className="instructions__side">
          <div className="instructions__flatten">
            <span className="instructions__flatten-label">{t('instructions.flattenLabel')}</span>
            <span className="instructions__flatten-examples">{t('instructions.flattenExamples')}</span>
          </div>
          <div className="instructions__save-row">
            {countrySelected?.value && (
              <div className="instructions__current">
                <span className="instructions__current-flag">📍</span>
                <span>{countrySelected.label}{provinceSelected?.label ? ` · ${provinceSelected.label}` : ''}</span>
              </div>
            )}
            <button
              className={`instructions__save-btn${saved ? ' instructions__save-btn--saved' : ''}`}
              onClick={handleSave}
              disabled={!countrySelected?.value}
            >
              {saved ? t('instructions.savedAlert') : t('instructions.saveBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructions;

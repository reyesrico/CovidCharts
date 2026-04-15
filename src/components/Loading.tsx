import React from 'react';
import { useTranslation } from 'react-i18next';
import LoadingProps, { LoadingSize } from '../types/LoadingProps';

import './Loading.scss';

function getSize(size: LoadingSize): number {
  switch (size) {
    case 'sm': return 20;
    case 'md': return 32;
    case 'lg': return 48;
    case 'xl': return 72;
    default:   return 32;
  }
}

const Loading: React.FC<LoadingProps> = ({ size, message, showProgress }) => {
  const { t } = useTranslation();
  const px = getSize(size);
  const displayMessage = message ?? t('header.loadingCountries');
  const isFullPage = !showProgress;

  return (
    <div className={isFullPage ? 'loading loading--full' : 'loading loading--inline'}>
      <div className="loading__ring" style={{ width: px, height: px }}>
        <svg viewBox="0 0 50 50" className="loading__svg">
          <circle className="loading__track" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
          <circle className="loading__arc"   cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
        </svg>
      </div>
      {displayMessage && <p className="loading__message">{displayMessage}</p>}
    </div>
  );
};

export default Loading;

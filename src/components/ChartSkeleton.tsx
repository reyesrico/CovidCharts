import React from 'react';
import './ChartSkeleton.scss';

interface ChartSkeletonProps {
  height?: number;
  message?: string;
}

const ChartSkeleton: React.FC<ChartSkeletonProps> = ({ height = 280, message }) => (
  <div className="chart-skeleton" style={{ height }}>
    <div className="chart-skeleton__shimmer" />
    <div className="chart-skeleton__content">
      <svg viewBox="0 0 50 50" className="chart-skeleton__spinner">
        <circle className="chart-skeleton__spinner-track" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
        <circle className="chart-skeleton__spinner-arc"   cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
      </svg>
      {message && <div className="chart-skeleton__message">{message}</div>}
    </div>
  </div>
);

export default ChartSkeleton;

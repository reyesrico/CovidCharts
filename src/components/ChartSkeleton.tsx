import React from 'react';
import './ChartSkeleton.scss';

interface ChartSkeletonProps {
  height?: number;
  message?: string;
}

const ChartSkeleton: React.FC<ChartSkeletonProps> = ({ height = 280, message }) => (
  <div className="chart-skeleton" style={{ height }}>
    <div className="chart-skeleton__shimmer" />
    {message && <div className="chart-skeleton__message">{message}</div>}
  </div>
);

export default ChartSkeleton;

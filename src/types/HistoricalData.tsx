type Timeline = {
  cases: Record<string, number>;
  deaths: Record<string, number>;
  recovered: Record<string, number>;
};

type HistoricalData = {
  country: string;
  province: string | null;
  timeline: Timeline;
};

export default HistoricalData;

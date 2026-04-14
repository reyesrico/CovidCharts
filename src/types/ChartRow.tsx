type ChartRow = {
  date: string;
  cases: number;
  deaths: number;
  recovered?: number;
  newCases: number;
  newDeaths: number;
};

export default ChartRow;

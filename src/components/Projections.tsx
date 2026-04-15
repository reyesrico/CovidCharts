import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import dayjs from 'dayjs';
import { isEmpty, isEqual } from 'lodash';

import CountryDataRow from '../types/CountryDataRow';
import ProjectionsProps from '../types/ProjectionsProps';
import SMAType from '../types/SMAType';
import { computeSMA, trainModel, makePredictions } from '../helpers/ProjectionsHelper.js';

import './Projections.scss';

const INITIAL_STATE = {
  projectedData: [] as any[],
  trainedData: [] as SMAType[],
  modelTrained: {} as any,
  readingEpoch: 0,
  windowSize: 7,
  epochSize: 10,
  trainingSize: 70,
  learningRate: 0.1,
  hiddenLayers: 1,
  predValues: [] as any[],
  predTimestamps: [] as any[],
  loadingTrain: false,
};

const Projections: React.FC<ProjectionsProps> = ({ data, type }) => {
  const [projectedData, setProjectedData] = useState(INITIAL_STATE.projectedData);
  const [trainedData, setTrainedData] = useState<SMAType[]>([]);
  const [modelTrained, setModelTrained] = useState<any>({});
  const [readingEpoch, setReadingEpoch] = useState(0);
  const [windowSize, setWindowSize] = useState(7);
  const [epochSize, setEpochSize] = useState(10);
  const [trainingSize, setTrainingSize] = useState(70);
  const [learningRate, setLearningRate] = useState(0.1);
  const [hiddenLayers, setHiddenLayers] = useState(1);
  const [predValues, setPredValues] = useState<any[]>([]);
  const [predTimestamps, setPredTimestamps] = useState<any[]>([]);
  const [loadingTrain, setLoadingTrain] = useState(false);

  useEffect(() => {
    setTrainedData(computeSMA(data, type, 7));
  }, []);

  useEffect(() => {
    setProjectedData([]);
    setTrainedData(computeSMA(data, type, windowSize));
    setModelTrained({});
    setReadingEpoch(0);
    setWindowSize(7);
    setEpochSize(7);
    setTrainingSize(70);
    setLearningRate(0.1);
    setHiddenLayers(1);
    setPredValues([]);
    setPredTimestamps([]);
    setLoadingTrain(false);
  }, [data]);

  const getSeries = useCallback((showProjected: boolean) => {
    let series: any = [];
    let confirmed: any = [];
    let trained: any = [];
    let predicted: any = [];
    let counter = 0;

    data.forEach((row: CountryDataRow, index: number) => {
      confirmed.push([dayjs(row.Date).valueOf(), row[type]]);
      if (index >= windowSize) {
        const trainedRow: SMAType = trainedData[counter++];
        trained.push([dayjs(row.Date).valueOf(), Math.round(trainedRow.avg)]);
      }
    });

    if (showProjected) {
      predValues.forEach((value: number, index: number) => {
        predicted.push([dayjs(predTimestamps[index]).valueOf(), Math.round(value)]);
      });
    }

    series.push({ type: 'area', name: type, data: confirmed });
    series.push({ type: 'line', name: 'Trained', data: trained });
    series.push({ type: 'line', name: 'Predicted', data: predicted, color: '#FF00FF' });
    return series;
  }, [data, type, windowSize, trainedData, predValues, predTimestamps]);

  const renderChart = (showProjected: boolean = false) => {
    const series = getSeries(showProjected);
    const actualData = series[0].data as [number, number][];
    const trainedSeries = series[1].data as [number, number][];
    const predictedData = series[2].data as [number, number][];

    const map = new Map<number, any>();
    actualData.forEach(([ts, v]) => map.set(ts, { date: dayjs(ts).format('MM/DD/YY'), [type]: v }));
    trainedSeries.forEach(([ts, v]) => { const r = map.get(ts) || { date: dayjs(ts).format('MM/DD/YY') }; r.Trained = v; map.set(ts, r); });
    predictedData.forEach(([ts, v]) => { const r = map.get(ts) || { date: dayjs(ts).format('MM/DD/YY') }; r.Predicted = v; map.set(ts, r); });
    const chartData = Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey={type} stroke="#457B9D" dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="Trained" stroke="#2A9D8F" dot={false} isAnimationActive={false} />
          {showProjected && <Line type="monotone" dataKey="Predicted" stroke="#FF00FF" strokeDasharray="5 5" dot={false} isAnimationActive={false} />}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const handleTrainModel = async () => {
    setLoadingTrain(true);
    let epoch_loss: any[] = [];

    let inputs = trainedData.map((row: SMAType) =>
      row['set'].map((val: CountryDataRow) => val[type])
    );
    let outputs = trainedData.map((row: SMAType) => row.avg);

    const callback = (epoch: number, log: any) => {
      setReadingEpoch(epoch + 1);
      epoch_loss.push(log.loss);
    };

    const trained = await trainModel(inputs, outputs, trainingSize, windowSize, epochSize, learningRate, hiddenLayers, callback);
    console.log(trained);
    console.log(epoch_loss);
    setModelTrained(trained);
    setLoadingTrain(false);
  };

  const predict = () => {
    if (isEmpty(modelTrained)) return;

    let inputs = trainedData.map((row: SMAType) =>
      row['set'].map((val: CountryDataRow) => val[type])
    );
    let outputs = trainedData.map((row: SMAType) => row.avg);

    // @ts-ignore
    const pred_vals = makePredictions(inputs, trainingSize, modelTrained['model']);
    const timestamps_c = data.map(val => val.Date).splice(windowSize + Math.floor(trainingSize / 100 * outputs.length), data.length);

    setPredValues(pred_vals);
    setPredTimestamps(timestamps_c);
  };

  if (!trainedData.length) return <div>Loading</div>;

  const loadingValue = Math.floor((readingEpoch / epochSize) * 100);

  return (
    <div className="projections">
      <h3>SMA Computed</h3>
      {trainedData && renderChart()}
      <hr />
      <h3>Training</h3>
      <button className="projections__train-btn" onClick={() => handleTrainModel()} disabled={loadingTrain}>Train Model</button>
      {loadingTrain && (
        <div className="projections__loading">
          <div>{`Loading ${loadingValue}%`}</div>
          <progress id="file" max={epochSize} value={readingEpoch}></progress>
        </div>
      )}
      {!loadingTrain && !isEmpty(modelTrained) && <div className="projections__model-trained">Model Trained!</div>}
      <hr />
      <h3>Validate</h3>
      <button onClick={() => predict()} disabled={isEmpty(modelTrained)}>Predict (See Console)</button>
      {!!predValues.length && renderChart(true)}
    </div>
  );
};

export default Projections;

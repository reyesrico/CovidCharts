import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import dayjs from 'dayjs';
import { isEqual } from 'lodash';
import { useTranslation } from 'react-i18next';

import Loading from './Loading';
import { processData, generateNextDayPrediction, minMaxScaler, minMaxInverseScaler, getMin, getMax } from '../helpers/predictionsHelper';
import './CovidPredictions.scss';

const Y_VALUES = ['Confirmed', 'Deaths', 'Recovered', 'Active'];

/**
 * 1D-CNN model for univariate time-series prediction.
 * Input: sliding window of `timePortion` consecutive values.
 * Architecture: Conv1D(128) → AvgPool → Conv1D(64) → AvgPool → Flatten → Dense(1)
 * Trained once; `predictMore` extends using the already-trained model autoregressively.
 */
const CovidPredictions = ({ data }) => {
  const { t } = useTranslation();
  const [epochs]      = useState(50);   // reduced from 100 for faster in-browser training
  const [timePortion] = useState(7);
  const [predictedData,  setPredictedData]  = useState([]);
  const [predictedDates, setPredictedDates] = useState([]);
  const [isLoading,  setIsLoading]  = useState(false);
  const [message,    setMessage]    = useState('');
  const [progress,   setProgress]   = useState(0);   // 0-100 training progress
  const [error,      setError]      = useState(null);
  const [model,      setModel]      = useState(null);
  const [wait,       setWait]       = useState(false);
  const [type,       setType]       = useState('Confirmed');
  const prevDataRef = useRef(data);

  const resetPredictions = () => {
    setPredictedData([]);
    setPredictedDates([]);
    setIsLoading(false);
    setMessage('');
    setProgress(0);
    setError(null);
    setWait(false);
    setModel(null);
  };

  useEffect(() => {
    if (!isEqual(prevDataRef.current, data)) {
      prevDataRef.current = data;
      resetPredictions();
      setType('Confirmed');
    }
  }, [data]);

  useEffect(() => {
    resetPredictions();
  }, [type]);

  const buildCnn = (modelData) => new Promise((resolve, reject) => {
    try {
      const m = tf.sequential();
      m.add(tf.layers.inputLayer({ inputShape: [timePortion, 1] }));
      m.add(tf.layers.conv1d({ kernelSize: 2, filters: 64, strides: 1, useBias: true, activation: 'relu', kernelInitializer: 'VarianceScaling' }));
      m.add(tf.layers.averagePooling1d({ poolSize: [2], strides: [1] }));
      m.add(tf.layers.conv1d({ kernelSize: 2, filters: 32, strides: 1, useBias: true, activation: 'relu', kernelInitializer: 'VarianceScaling' }));
      m.add(tf.layers.averagePooling1d({ poolSize: [2], strides: [1] }));
      m.add(tf.layers.flatten());
      m.add(tf.layers.dense({ units: 1, kernelInitializer: 'VarianceScaling', activation: 'linear' }));
      resolve({ model: m, data: modelData });
    } catch (err) {
      reject(`Model not created: ${err}`);
    }
  });

  const trainCnn = (cnnModel, tensorData) => new Promise((resolve, reject) => {
    try {
      cnnModel.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
      cnnModel.fit(tensorData.tensorTrainX, tensorData.tensorTrainY, {
        epochs,
        callbacks: {
          onEpochEnd: (epoch) => setProgress(Math.round(((epoch + 1) / epochs) * 100)),
        },
      }).then(() => resolve(cnnModel));
    } catch (ex) {
      reject(ex);
    }
  });

  const loadData = () => {
    const labels = data.map(row => row.Date);
    setIsLoading(true);
    setProgress(0);
    setMessage('Processing data…');

    processData(data, type, timePortion).then(result => {
      const nextDayPrediction = generateNextDayPrediction(result.originalData, result.timePortion);
      setMessage('Building model…');

      buildCnn(result).then(built => {
        const tensorData = {
          tensorTrainX: tf.tensor1d(built.data.trainX).reshape([built.data.size, built.data.timePortion, 1]),
          tensorTrainY: tf.tensor1d(built.data.trainY),
        };
        const { max, min } = built.data;
        setMessage('Training CNN…');
        setModel(built.model);

        trainCnn(built.model, tensorData).then(trainedModel => {
          setMessage('Generating predictions…');
          const predictedX   = trainedModel.predict(tensorData.tensorTrainX);
          const scaledNextDay = minMaxScaler(nextDayPrediction, min, max);
          const tensorNextDay = tf.tensor1d(scaledNextDay.data).reshape([1, timePortion, 1]);
          const predictedValue = trainedModel.predict(tensorNextDay);

          predictedValue.data().then(predValue => {
            const inversePred = minMaxInverseScaler(predValue, min, max);
            predictedX.data().then(pred => {
              let predictedXInverse = minMaxInverseScaler(pred, min, max);
              predictedXInverse.data = Array.prototype.slice.call(predictedXInverse.data);
              predictedXInverse.data = [...predictedXInverse.data, ...inversePred.data];
              setPredictedData(predictedXInverse.data);
              setPredictedDates(labels);
              setIsLoading(false);
              setMessage('');
              setProgress(100);
            });
          });
        }, err => { setError(String(err)); setIsLoading(false); });
      }, err => { setError(String(err)); setIsLoading(false); });
    });
  };

  const predictMore = () => {
    if (!model) return;
    setWait(true);
    const nextDayPrediction = generateNextDayPrediction([...predictedData], timePortion);
    const min = getMin(predictedData);
    const max = getMax(predictedData);
    const scaledNextDay = minMaxScaler(nextDayPrediction, min, max);
    const tensor = tf.tensor1d(scaledNextDay.data).reshape([1, timePortion, 1]);
    model.predict(tensor).data().then(pred => {
      let inv = minMaxInverseScaler(pred, min, max);
      inv.data = Array.prototype.slice.call(inv.data);
      setPredictedData(prev => [...prev, ...inv.data]);
      setWait(false);
    });
  };

  const buildChartData = () => {
    const current = data.map(row => ({ ts: dayjs(row.Date).valueOf(), val: row[type] }));
    if (!current.length) return { rows: [], splitDate: null };

    const map = new Map();
    current.forEach(({ ts, val }) => map.set(ts, { date: dayjs(ts).format('MM/DD/YY'), Actual: val }));

    let splitDate = null;
    if (predictedData.length && predictedDates.length) {
      let dates = [];
      predictedData.forEach((value, index) => {
        const dayjsDate = predictedDates.length > (index + timePortion)
          ? dayjs(predictedDates[index + timePortion])
          : dates[dates.length - 1].add(1, 'day');
        dates.push(dayjsDate);
        const ts = dayjsDate.valueOf();
        const existing = map.get(ts) || { date: dayjsDate.format('MM/DD/YY') };
        existing.Predicted = Math.round(value);
        map.set(ts, existing);
      });

      // Find where Predicted appears without Actual (first future point)
      const all = Array.from(map.values());
      const firstFuture = all.find(r => r.Predicted !== undefined && r.Actual === undefined);
      if (firstFuture) {
        splitDate = firstFuture.date;
        // Bridge: last Actual point also gets Predicted so lines connect
        const bridgeIdx = all.indexOf(firstFuture) - 1;
        if (bridgeIdx >= 0) all[bridgeIdx].Predicted = all[bridgeIdx].Actual;
      }
    }

    return { rows: Array.from(map.values()), splitDate };
  };

  if (error) return <div className="covid-predictions__error">Error: {error}</div>;

  const { rows: chartData, splitDate } = buildChartData();
  const hasPredicted = chartData.some(d => d.Predicted !== undefined);

  return (
    <div className="cpred">
      {/* Metric selector */}
      <div className="cpred__controls">
        <div className="cpred__control-group">
          <span className="cpred__label">{t('predictions.metric')}</span>
          <div className="cpred__pills">
            {Y_VALUES.map(v => (
              <button
                key={v}
                className={`cpred__pill${type === v ? ' cpred__pill--active' : ''}`}
                onClick={() => setType(v)}
                disabled={isLoading}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="cpred__control-group cpred__control-group--actions">
          <button
            className="cpred__btn cpred__btn--primary"
            disabled={isLoading || predictedData.length > 0}
            onClick={loadData}
          >
            {isLoading ? t('predictions.training', { n: progress }) : t('predictions.trainBtn')}
          </button>
          {!!predictedData.length && !isLoading && (
            <button
              className="cpred__btn cpred__btn--secondary"
              disabled={wait || !model}
              onClick={predictMore}
            >
              {wait ? t('predictions.training', { n: '…' }) : t('predictions.extendBtn')}
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {isLoading && (
        <div className="cpred__progress-wrap">
          <div className="cpred__progress-bar" style={{ width: `${progress}%` }} />
          <span className="cpred__progress-label">{message}</span>
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="cpActualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#457B9D" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#457B9D" stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          {splitDate && (
            <ReferenceLine x={splitDate} stroke="#aaa" strokeDasharray="4 4"
              label={{ value: 'Forecast →', fontSize: 11, fill: '#888', position: 'insideTopRight' }} />
          )}
          <Area
            type="monotone"
            dataKey="Actual"
            stroke="#457B9D"
            fill="url(#cpActualGrad)"
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
          {hasPredicted && (
            <Line
              type="monotone"
              dataKey="Predicted"
              stroke="#E63946"
              strokeDasharray="6 3"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CovidPredictions;


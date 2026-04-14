import React, { Component } from 'react';
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

class Projections extends Component<ProjectionsProps, any> {
  state = {
    projectedData: [],
    trainedData: [],
    modelTrained: {},
    readingEpoch: 0,
    windowSize: 7,
    epochSize: 10,       // 1000 takes so much time!
    trainingSize: 70,     // Value in %
    learningRate: 0.1,   // Learn super fast!
    hiddenLayers: 1,
    predValues: [],
    predTimestamps: [],
    loadingTrain: false
  };

  componentDidMount() {
    const { data, type } = this.props;
    const { windowSize } = this.state;

    this.setState({ trainedData: computeSMA(data, type, windowSize) });
  }

  componentDidUpdate(prevProps: ProjectionsProps, prevState: any) {
    const { data } = this.props;

    if (!isEqual(prevProps.data, data)) {
      this.clearState();
    }
  }

  clearState = () => {
    const { data, type } = this.props;
    const { windowSize } = this.state;

    this.setState({
      projectedData: [],
      trainedData: computeSMA(data, type, windowSize),
      modelTrained: {},
      readingEpoch: 0,
      windowSize: 7,
      epochSize: 7,
      trainingSize: 70,
      learningRate: 0.1,
      hiddenLayers: 1,  
      predValues: [],
      predTimestamps: [],
      loadingTrain: false  
    });
  }

  getSeries = (showProjected: boolean) => {
    const { data, type } = this.props;
    const { predValues, predTimestamps, trainedData, windowSize } = this.state;

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
    series.push({ type: 'line', name: 'Predicted', data: predicted, color: '#FF00FF' })

    return series;
  }

  renderChart(showProjected: boolean = false) {
    const { type } = this.props;
    const series = this.getSeries(showProjected);
    const actualData = series[0].data as [number, number][];
    const trainedData = series[1].data as [number, number][];
    const predictedData = series[2].data as [number, number][];

    // Merge all series into flat recharts-compatible objects keyed by timestamp
    const map = new Map<number, any>();
    actualData.forEach(([ts, v]) => map.set(ts, { date: dayjs(ts).format('MM/DD/YY'), [type]: v }));
    trainedData.forEach(([ts, v]) => { const r = map.get(ts) || { date: dayjs(ts).format('MM/DD/YY') }; r.Trained = v; map.set(ts, r); });
    predictedData.forEach(([ts, v]) => { const r = map.get(ts) || { date: dayjs(ts).format('MM/DD/YY') }; r.Predicted = v; map.set(ts, r); });
    const data = Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
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
  }

  trainModel = async () => {
    const { type } = this.props;
    const { trainedData, trainingSize, windowSize, epochSize, learningRate, hiddenLayers } = this.state;

    this.setState({ loadingTrain: true });
    let epoch_loss: any = [];

    let inputs = trainedData.map((row: SMAType) => {
      return row['set'].map((val: CountryDataRow) => val[type])
    });

    let outputs = trainedData.map((row: SMAType) => row.avg);
  
    let trainingsize = trainingSize;
    let n_epochs = epochSize;
    let learningrate = learningRate;
    let n_hiddenlayers = hiddenLayers;
  
    let callback = (epoch: number, log: any) => {
      this.setState({ readingEpoch: epoch + 1});
      epoch_loss.push(log.loss);  
    };
  
    let modelTrained = await trainModel(inputs, outputs, trainingsize, windowSize, n_epochs, learningrate, n_hiddenlayers, callback);
    console.log(modelTrained);
    console.log(epoch_loss);
    this.setState({ modelTrained, loadingTrain: false });
  }

  predict = () => {
    const { data, type } = this.props;
    const { trainedData, trainingSize, modelTrained, windowSize } = this.state;

    if (isEmpty(modelTrained)) return;

    let inputs = trainedData.map((row: SMAType) => {
      return row['set'].map((val: CountryDataRow) => val[type])
    });

    console.log(inputs);

    let outputs = trainedData.map((row: SMAType) => row.avg);

    console.log(outputs);

    let trainingsize = trainingSize;

    console.log(`data.length: ${data.length}`);
    console.log(`trainedData.length: ${trainedData.length}`);
    console.log(`trainingsize: ${trainingsize}`);

    let outps = outputs.slice(Math.floor(trainingsize / 100 * outputs.length), outputs.length);
    console.log(`outps (Expected)`);
    console.log(outps);

    // @ts-ignore
    let pred_vals = makePredictions(inputs, trainingsize, modelTrained['model']);
    console.log(`pred_vals`);   
    console.log(pred_vals);

     let timestamps_c = data.map(val => val.Date).splice(windowSize + Math.floor(trainingsize / 100 * outputs.length), data.length);
     console.log(timestamps_c);

     // THIS IS THE ULTIMATE GOAL! GET PROJECTED / PREDICTED VALUES!
     this.setState({ predValues: pred_vals, predTimestamps: timestamps_c });
  }

  renderLoading() {
    const { readingEpoch, epochSize } = this.state;

    const value = Math.floor((readingEpoch/epochSize)*100); 
    return (
      <div className="projections__loading">
        <div>{`Loading ${value}%`}</div>
        <progress id="file" max={epochSize} value={readingEpoch}></progress>
      </div>
    );
  }

  render() {
    const { trainedData, modelTrained, loadingTrain, predValues } = this.state;

    if (!trainedData.length) return <div>Loading</div>;

    return (
      <div className="projections">
        <h3>SMA Computed</h3>
        {trainedData && this.renderChart()}
        <hr />
        <h3>Training</h3>
        <button className="projections__train-btn" onClick={event => event && this.trainModel()} disabled={loadingTrain}>Train Model</button>
        {loadingTrain && this.renderLoading()}
        {!loadingTrain && !isEmpty(modelTrained) && (<div className="projections__model-trained">Model Trained!</div>)}
        <hr />
        <h3>Validate</h3>
        <button onClick={event => event && this.predict()} disabled={isEmpty(modelTrained)}>Predict (See Console)</button>
        {!!predValues.length && this.renderChart(true)}
      </div>      
    )
  }
}

export default Projections;

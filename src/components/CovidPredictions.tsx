import React, { Component } from 'react';
import * as tf from '@tensorflow/tfjs';

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import moment from 'moment';
import { isEqual } from 'lodash';

import CountryDataRow from '../types/CountryDataRow';
import CovidPredictionsProps from '../types/CovidPredictionsProps';
import Loading from './Loading';
import options from '../helpers/charts';
import './CovidPredictions.scss';

import { processData, generateNextDayPrediction, minMaxScaler, minMaxInverseScaler, getMin, getMax } from '../helpers/predictionsHelper';

class CovidPredictions extends Component<CovidPredictionsProps, any> {
  state = {
    epochs: 100,
    timePortion: 7,
    predictedData: [],
    predictedDates: [],
    isLoading: false,
    message: '',
    error: null,
    model: { predict: (rank: any) => {} },
    wait: false,
    yValues: ['Confirmed', 'Deaths', 'Recovered', 'Active'],
    type: 'Confirmed'
  }

  componentDidUpdate(prevProps: CovidPredictionsProps, prevState: any) {
    if (!isEqual(prevProps, this.props)) {
      this.setState({
        predictedData: [],
        predictedDates: [],
        isLoading: false,
        message: '',
        error: null,
        wait: false,
        type: 'Confirmed'
      });
    } else if (!isEqual(prevState.type, this.state.type)) {
      this.setState({
        predictedData: [],
        predictedDates: [],
        isLoading: false,
        message: '',
        error: null,
        wait: false,
      });
    }
  }

  buildCnn = (data: any) => {
    return new Promise((resolve, reject) => {
      // Linear (sequential) stack of layers
      let model = tf.sequential();

      // Define input layer
      model.add(tf.layers.inputLayer({
        inputShape: [7, 1],
      }));

      let layer = tf.layers.conv1d({
        kernelSize: 2,
        filters: 128,
        strides: 1,
        useBias: true,
        activation: 'relu',
        kernelInitializer: 'VarianceScaling'
      });

      // Add the first convolutional layer
      model.add(layer);

      // Add the Average Pooling layer
      model.add(tf.layers.averagePooling1d({
        poolSize: [2],
        strides: [1]
      }));

      // Add the second convolutional layer
      model.add(tf.layers.conv1d({
        kernelSize: 2,
        filters: 64,
        strides: 1,
        useBias: true,
        activation: 'relu',
        kernelInitializer: 'VarianceScaling'
      }));

      // Add the Average Pooling layer
      model.add(tf.layers.averagePooling1d({
        poolSize: [2],
        strides: [1]
      }));

      // Add Flatten layer, reshape input to (number of samples, number of features)
      model.add(tf.layers.flatten({

      }));

      // Add Dense layer, 
      model.add(tf.layers.dense({
        units: 1,
        kernelInitializer: 'VarianceScaling',
        activation: 'linear'
      }));

      if (model) {
        return resolve({
          'model': model,
          'data': data
        });  
      } else {
        return reject(`Model not created`);
      }
    });
  }

  cnn = (model: any, data: any, epochs: number) => {
    // console.log("MODEL SUMMARY: ")
    model.summary();

    return new Promise((resolve, reject) => {
      try {
        // Optimize using adam (adaptive moment estimation) algorithm
        model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

        // Train the model
        model.fit(data.tensorTrainX, data.tensorTrainY, { epochs: epochs }).then((result: any) => {
          // console.log("Loss after last Epoch (" + result.epoch.length + ") is: " + result.history.loss[result.epoch.length - 1]);
          resolve(model);
        });
      }
      catch (ex) {
        reject(ex);
      }
    });
  }

  loadData = () => {
    const { data } = this.props;
    const { timePortion, epochs, type } = this.state;

    // Get the datetime labels use in graph
    let labels = data.map((row: CountryDataRow) => row.Date);    // DATES!!!

    this.setState({ isLoading: true, message: 'Processing...' });

    // Process the data and create the train sets
    processData(data, type, timePortion).then(result => {     // TIMEPORTION IS WINDOWSIZE

      // Crate the set for stock price prediction for the next day
      let nextDayPrediction = generateNextDayPrediction(result.originalData, result.timePortion);

      this.setState({ message: "Building CNN "});

      // Build the Convolutional Tensorflow model
      this.buildCnn(result).then((built: any) => {

        // Transform the data to tensor data
        // Reshape the data in neural network input format [number_of_samples, timePortion, 1];
        let tensorData = {
          tensorTrainX: tf.tensor1d(built.data.trainX).reshape([built.data.size, built.data.timePortion, 1]),
          tensorTrainY: tf.tensor1d(built.data.trainY)
        };

        // Rember the min and max in order to revert (min-max scaler) the scaled data later 
        let max = built.data.max;
        let min = built.data.min;

        this.setState({ message: "Getting model" });
        // Train the model using the tensor data
        // Repeat multiple epochs so the error rate is smaller (better fit for the data)
        this.cnn(built.model, tensorData, epochs).then((model: any) => {

          this.setState({ model });

          // Predict for the same train data
          // We gonna show the both (original, predicted) sets on the graph 
          // so we can see how well our model fits the data
          var predictedX = model.predict(tensorData.tensorTrainX);

          // Scale the next day features
          let nextDayPredictionScaled = minMaxScaler(nextDayPrediction, min, max);
          // Transform to tensor data
          let tensorNextDayPrediction = tf.tensor1d(nextDayPredictionScaled.data).reshape([1, built.data.timePortion, 1]);

          // Predict the next day stock price
          let predictedValue = model.predict(tensorNextDayPrediction);

          this.setState({ message: "Getting predictedValue data" });
          // Get the predicted data for the train set
          predictedValue.data().then((predValue: any) => {

            // Revert the scaled features, so we get the real values
            let inversePredictedValue = minMaxInverseScaler(predValue, min, max);

            this.setState({ message: "Finishing and cleaning data "});
            // Get the next day predicted value
            predictedX.data().then((pred: any) => {
              // Revert the scaled feature
              var predictedXInverse = minMaxInverseScaler(pred, min, max);

              // Convert Float32Array to regular Array, so we can add additional value
              predictedXInverse.data = Array.prototype.slice.call(predictedXInverse.data);
              // Add the next day predicted stock price so it's showed on the graph
              predictedXInverse.data = [
                ...predictedXInverse.data,
                ...inversePredictedValue.data];  // EL ULTIMO
              // predictedXInverse.data[predictedXInverse.data.length] = inversePredictedValue.data[0];

              // Revert the scaled labels from the trainY (original), 
              // so we can compare them with the predicted one
              // var trainYInverse = minMaxInverseScaler(built.data.trainY, min, max);

              // Plot the original (trainY) and predicted values for the same features set (trainX)
              // plotData(trainYInverse.data, predictedXInverse.data, labels);
              // console.log(trainYInverse.data);   // 123   vs 130 total
              // console.log(predictedXInverse.data);  // 124   (123 + 1)
              // console.log(labels);  // 130 ?

              this.setState({ predictedData: predictedXInverse.data, predictedDates: labels, isLoading: false, message: "" });
            });
          });
        }, (error: any) => this.setState({ error, isLoading: false }));
      }, (error: any) => this.setState({ error, isLoading: false }));
    });
  }

  predictMore = () => {
    const { predictedData, timePortion, model } = this.state;

    this.setState({ wait: true });
    let data = [...predictedData];
    let nextDayPrediction = generateNextDayPrediction(data, timePortion);

    let min = getMin(predictedData);
    let max = getMax(predictedData);
    let nextDayPredictionScaled = minMaxScaler(nextDayPrediction, min, max);
    let tensorNextDayPrediction = tf.tensor1d(nextDayPredictionScaled.data).reshape([1, timePortion, 1]);
    let newPredictedValue = model.predict(tensorNextDayPrediction);

    // @ts-ignore
    newPredictedValue.data().then((pred: any) => {
      let predictedXInverse = minMaxInverseScaler(pred, min, max);
      predictedXInverse.data = Array.prototype.slice.call(predictedXInverse.data);
      this.setState({ predictedData: [...predictedData, ...predictedXInverse.data], wait: false });
    });
  }

  getSeries = () => {
    const { data } = this.props;
    const { predictedData, predictedDates, timePortion, type } = this.state;

    let series: any = [];
    // @ts-ignore
    let current = data.map((row: CountryDataRow) => [moment(row.Date).valueOf(), row[type]]);
    let predicted = null;
    let dates: any = [];

    if (predictedData.length && predictedDates.length) {
      predicted = predictedData.map((value: number, index: number) => {
        const momentDate = predictedDates.length > (index + timePortion) ? moment(predictedDates[index + timePortion]) : dates[dates.length-1].add(1, 'days');
        dates.push(momentDate);  
        return [momentDate.valueOf(), value];
      });
    }

    series.push({ type: 'area', name: type, data: current });
    predicted && series.push({ type: 'line', name: `Predicted ${type}`, data: predicted, color: '#FF00FF' });

    return series;
  }

  renderChart() {
    const { width } = this.props;

    const plotOptions = {
      ...options,
      chart: { ...options.chart, width },
      series: this.getSeries()
    };

    return (<HighchartsReact highcharts={Highcharts} options={plotOptions} />);
  }

  renderOptions = () => {
    const { yValues, type } = this.state;
   
    return (
      <div className="covid-predictions__options">
        <div className="covid-predictions__values">Values (Y Axis)</div>
        {yValues.map((yValue: string, index: number) => {
          return (
              <label className="covid-predictions__value" key={index}>
                <input type="radio" value={yValue} checked={type === yValue}
                  onChange={event => event && this.setState({ type: event.target.value })} />
                {yValue}
              </label>);
        })}
      </div>
    )
  }

  renderChartState() {
    const { isLoading, message, wait, predictedData } = this.state;

    return (
      <div className="covid-predictions__wrapper">
        {<button disabled={isLoading || predictedData.length > 0} onClick={event => event && this.loadData()}>Generate Model!</button>}
        {isLoading && (<Loading size="xl" message={message} showProgress={true} />)}
        {!isLoading && this.renderChart()}
        {!!predictedData.length && !isLoading && <button disabled={wait} onClick={event => event && this.predictMore()}>Predict next day!</button>}
      </div>
    )
  }

  render() {
    const { error } = this.state;

    if (error) return (<div>Couldn't load chart: {error}</div>);

    return (
      <div className="covid-predictions">
        {this.renderOptions()}
        {this.renderChartState()}
      </div>
    );
  }
}

export default CovidPredictions;

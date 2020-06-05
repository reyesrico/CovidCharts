import React, { Component } from 'react';
import * as tf from '@tensorflow/tfjs';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import moment from 'moment';
import { isEqual } from 'lodash';

import CountryDataRow from '../types/CountryDataRow';
import Loading from './Loading';
import ProjectionsProps from '../types/ProjectionsProps';
import options from '../helpers/charts';
import './CovidPredictions.scss';

import { clearPrint, processData, generateNextDayPrediction, minMaxScaler, minMaxInverseScaler } from '../helpers/predictionsHelper';

class CovidPredictions extends Component<ProjectionsProps, any> {
  state = {
    epochs: 100,
    timePortion: 7,
    predictedData: [],
    predictedDates: [],
    isLoading: false
  }

  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate(prevProps: ProjectionsProps, prevState: any) {
    if (!isEqual(prevProps, this.props)) {
      this.loadData();
    }
  }

  buildCnn = (data: any) => {
    return new Promise((resolve, reject) => {
      // Linear (sequential) stack of layers
      const model = tf.sequential();

      // Define input layer
      model.add(tf.layers.inputLayer({
        inputShape: [7, 1],
      }));

      // Add the first convolutional layer
      model.add(tf.layers.conv1d({
        kernelSize: 2,
        filters: 128,
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

      return resolve({
        'model': model,
        'data': data
      });
    });
  }

  cnn = (model: any, data: any, epochs: number) => {
    console.log("MODEL SUMMARY: ")
    model.summary();

    return new Promise((resolve, reject) => {
      try {
        // Optimize using adam (adaptive moment estimation) algorithm
        model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

        // Train the model
        model.fit(data.tensorTrainX, data.tensorTrainY, { epochs: epochs }).then((result: any) => {
          /*for (let i = result.epoch.length-1; i < result.epoch.length; ++i) {
              print("Loss after Epoch " + i + " : " + result.history.loss[i]);
          }*/
          console.log("Loss after last Epoch (" + result.epoch.length + ") is: " + result.history.loss[result.epoch.length - 1]);
          resolve(model);
        });
      }
      catch (ex) {
        reject(ex);
      }
    });
  }

  loadData = () => {
    const { data, type } = this.props;
    const { timePortion, epochs } = this.state;

    clearPrint();
    console.log("Beginning Stock Prediction ...");

    // Get the datetime labels use in graph
    let labels = data.map((row: CountryDataRow) => row.Date);    // DATES!!!

    this.setState({ isLoading: true });
    // Process the data and create the train sets
    processData(data, type, timePortion).then(result => {     // TIMEPORTION IS WINDOWSIZE
      console.log(result);

      // Crate the set for stock price prediction for the next day
      let nextDayPrediction = generateNextDayPrediction(result.originalData, result.timePortion);

      console.log(`nextDayPrediction`);
      console.log(nextDayPrediction);

      // Get the last date from the data set
      // @ts-ignore
      // let predictDate = (new Date(labels[labels.length - 1] + 'T00:00:00.000')).addDays(1);

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

        // Train the model using the tensor data
        // Repeat multiple epochs so the error rate is smaller (better fit for the data)
        this.cnn(built.model, tensorData, epochs).then((model: any) => {

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

          // Get the predicted data for the train set
          predictedValue.data().then((predValue: any) => {
            // Revert the scaled features, so we get the real values
            let inversePredictedValue = minMaxInverseScaler(predValue, min, max);

            // Get the next day predicted value
            predictedX.data().then((pred: any) => {
              // Revert the scaled feature
              var predictedXInverse = minMaxInverseScaler(pred, min, max);

              // Convert Float32Array to regular Array, so we can add additional value
              predictedXInverse.data = Array.prototype.slice.call(predictedXInverse.data);
              // Add the next day predicted stock price so it's showed on the graph
              predictedXInverse.data[predictedXInverse.data.length] = inversePredictedValue.data[0];

              // Revert the scaled labels from the trainY (original), 
              // so we can compare them with the predicted one
              var trainYInverse = minMaxInverseScaler(built.data.trainY, min, max);

              // Plot the original (trainY) and predicted values for the same features set (trainX)
              // plotData(trainYInverse.data, predictedXInverse.data, labels);
              console.log(trainYInverse.data);
              // console.log(predictedXInverse.data);

              this.setState({ predictedData: predictedXInverse.data, predictedDates: labels, isLoading: false });
            });

            // Print the predicted stock price value for the next day
            // console.log("Predicted for date " + moment(predictDate).format("DD-MM-YYYY") + " is: " + inversePredictedValue.data[0].toFixed(3) + "$");

            console.log(`Predicted Values!!`);
            console.log(inversePredictedValue);
          });
        });
      });
    });
  }

  getSeries = () => {
    const { data, type } = this.props;
    const { predictedData, predictedDates, timePortion } = this.state;

    let series: any = [];
    let current = data.map((row: CountryDataRow) => [moment(row.Date).valueOf(), row.Confirmed]);
    let predicted = null;

    if (predictedData.length && predictedDates.length) {
      predicted = predictedData.map((value: number, index: number) => {
        let predictedValue = (index < timePortion) ? 0 : value;
        return [moment(predictedDates[index]).valueOf(), predictedValue];
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

  render() {
    const { isLoading } = this.state;

    return (
      <div className="covid-predictions">
        {isLoading && (<Loading size="lg" message="Training Data" />)}
        {this.renderChart()}
      </div>
    );
  }
}

export default CovidPredictions;

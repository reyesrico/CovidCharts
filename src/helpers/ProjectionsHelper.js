import * as tf from '@tensorflow/tfjs';

// https://github.com/jinglescode/demos/tree/master/src/app/components/tfjs-timeseries-stocks
export function computeSMA (data, type, window_size) {
  let r_avgs = []
  // let avg_prev = 0;
  for (let i = 0; i <= data.length - window_size; i++){
    let curr_avg = 0.00, t = i + window_size;
    for (let k = i; k < t && k <= data.length; k++){
      curr_avg += data[k][type] / window_size;
    }
    r_avgs.push({ set: data.slice(i, i + window_size), avg: curr_avg });
    // avg_prev = curr_avg;
  }

  return r_avgs;
}

// https://raw.githubusercontent.com/jinglescode/demos/master/src/app/components/tfjs-timeseries-stocks/standalone_demo/model.js
export async function trainModel(inputs, outputs, trainingsize, window_size, n_epochs, learning_rate, n_layers, callback) {
  const input_layer_shape  = window_size;
  const input_layer_neurons = window_size*2; // 100 - TBR 

  const rnn_input_layer_features = 2; // 10B-- TBR
  const rnn_input_layer_timesteps = input_layer_neurons / rnn_input_layer_features;

  const rnn_input_shape  = [rnn_input_layer_features, rnn_input_layer_timesteps];
  const rnn_output_neurons = 3; // 20

  const rnn_batch_size = window_size;

  const output_layer_shape = rnn_output_neurons;
  const output_layer_neurons = 1;

  const model = tf.sequential();

  let X = inputs.slice(0, Math.floor(trainingsize / 100 * inputs.length));
  let Y = outputs.slice(0, Math.floor(trainingsize / 100 * outputs.length));

  const xs = tf.tensor2d(X, [X.length, X[0].length]).div(tf.scalar(10));
  const ys = tf.tensor2d(Y, [Y.length, 1]).reshape([Y.length, 1]).div(tf.scalar(10));

  model.add(tf.layers.dense({units: input_layer_neurons, inputShape: [input_layer_shape]}));
  model.add(tf.layers.reshape({targetShape: rnn_input_shape}));

  let lstm_cells = [];
  for (let index = 0; index < n_layers; index++) {
       lstm_cells.push(tf.layers.lstmCell({units: rnn_output_neurons}));
  }

  model.add(tf.layers.rnn({
    cell: lstm_cells,
    inputShape: rnn_input_shape,
    returnSequences: false
  }));

  model.add(tf.layers.dense({units: output_layer_neurons, inputShape: [output_layer_shape]}));

  model.compile({
    optimizer: tf.train.adam(learning_rate),
    loss: 'meanSquaredError'
  });

  const hist = await model.fit(xs, ys,
    { batchSize: rnn_batch_size, epochs: n_epochs, callbacks: {
      onEpochEnd: async (epoch, log) => {
        callback(epoch, log);
      }
    }
  });

  return { model: model, stats: hist };
}

export function makePredictions(inputs, size, model) {
    let X = inputs.slice(Math.floor(size / 100 * inputs.length), inputs.length);
    const predictedResults = model.predict(tf.tensor2d(X, [X.length, X[0].length]).div(tf.scalar(10))).mul(10);
    console.log(predictedResults);
    return Array.from(predictedResults.dataSync());
}

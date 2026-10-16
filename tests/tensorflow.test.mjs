import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import * as tf from '../src/helpers/tensorflow.js';
import { computeSMA, trainModel, makePredictions } from '../src/helpers/ProjectionsHelper.js';

test('lockfile excludes the vulnerable TensorFlow CLI dependency chain', async () => {
  const lock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'));
  for (const name of ['@tensorflow/tfjs', 'sprintf-js']) {
    assert.ok(
      !Object.keys(lock.packages).some(path => path.endsWith(`/node_modules/${name}`) || path === `node_modules/${name}`),
      `${name} must not be installed`,
    );
  }
});

test('runtime declarations stay synchronized with the lockfile and Node default', async () => {
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const lock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'));
  const nodeVersion = await readFile(new URL('../.nvmrc', import.meta.url), 'utf8');
  assert.equal(nodeVersion.trim(), '22');
  assert.equal(manifest.engines.node, '^22.13.0 || >=24.0.0');
  assert.deepEqual(lock.packages[''].engines, manifest.engines);
  for (const name of ['tfjs-core', 'tfjs-layers', 'tfjs-backend-cpu', 'tfjs-backend-webgl']) {
    assert.equal(lock.packages[`node_modules/@tensorflow/${name}`].version, '2.8.6');
  }
});

test('CNN trains and predicts using the modular CPU runtime', async () => {
  await tf.setBackend('cpu');
  await tf.ready();

  const model = tf.sequential();
  model.add(tf.layers.inputLayer({ inputShape: [7, 1] }));
  model.add(tf.layers.conv1d({ kernelSize: 2, filters: 64, strides: 1, useBias: true, activation: 'relu', kernelInitializer: 'VarianceScaling' }));
  model.add(tf.layers.averagePooling1d({ poolSize: [2], strides: [1] }));
  model.add(tf.layers.conv1d({ kernelSize: 2, filters: 32, strides: 1, useBias: true, activation: 'relu', kernelInitializer: 'VarianceScaling' }));
  model.add(tf.layers.averagePooling1d({ poolSize: [2], strides: [1] }));
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 1, kernelInitializer: 'VarianceScaling', activation: 'linear' }));
  model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

  const xs = tf.tensor3d([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], [1, 7, 1]);
  const ys = tf.tensor1d([0.7]);
  let prediction;
  try {
    const history = await model.fit(xs, ys, { epochs: 1 });
    assert.ok(Number.isFinite(history.history.loss[0]));
    prediction = model.predict(xs);
    assert.deepEqual(prediction.shape, [1, 1]);
    assert.ok(Array.from(await prediction.data()).every(Number.isFinite));
  } finally {
    prediction?.dispose();
    xs.dispose();
    ys.dispose();
    model.optimizer.dispose();
    model.dispose();
  }
});

test('legacy recurrent projections still train and produce finite predictions', async () => {
  await tf.setBackend('cpu');
  const data = Array.from({ length: 10 }, (_, i) => ({ Confirmed: i + 1 }));
  const averages = computeSMA(data, 'Confirmed', 2);
  const inputs = averages.map(({ set }) => set.map(row => row.Confirmed));
  const outputs = averages.map(({ avg }) => avg);
  let completedEpochs = 0;
  const { model, stats } = await trainModel(inputs, outputs, 75, 2, 1, 0.01, 1, () => {
    completedEpochs += 1;
  });
  try {
    assert.equal(completedEpochs, 1);
    assert.ok(Number.isFinite(stats.history.loss[0]));
    const predictions = makePredictions(inputs, 75, model);
    assert.equal(predictions.length, inputs.length - Math.floor(inputs.length * 0.75));
    assert.ok(predictions.every(Number.isFinite));
  } finally {
    model.optimizer.dispose();
    model.dispose();
  }
});

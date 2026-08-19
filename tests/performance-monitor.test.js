const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildNavigationMetrics,
  calculateCls,
  roundMetric,
  summarizeInteractions,
  summarizeLongTasks,
  summarizeResources
} = require('../assets/js/performance-monitor.js');

test('summarizes long tasks without changing their measurements', () => {
  assert.deepEqual(summarizeLongTasks([
    { duration: 70.25 },
    { duration: 130.5 }
  ]), {
    count: 2,
    totalDuration: 200.8,
    maxDuration: 130.5,
    blockingDurationAbove50: 100.8
  });
});

test('calculates CLS using session windows and excludes recent input', () => {
  assert.equal(calculateCls([
    { startTime: 100, value: 0.04, hadRecentInput: false },
    { startTime: 700, value: 0.03, hadRecentInput: false },
    { startTime: 900, value: 0.9, hadRecentInput: true },
    { startTime: 2500, value: 0.05, hadRecentInput: false }
  ]), 0.07);
});

test('reports an INP candidate separately from the worst interaction', () => {
  assert.deepEqual(summarizeInteractions([
    { interactionId: 1, duration: 72 },
    { interactionId: 1, duration: 90 },
    { interactionId: 2, duration: 48 },
    { interactionId: 0, duration: 500 }
  ]), {
    interactionCount: 2,
    maxDuration: 90,
    inpCandidate: 90
  });
});

test('extracts navigation timings and transfer sizes', () => {
  assert.deepEqual(buildNavigationMetrics({
    startTime: 0,
    responseStart: 120.25,
    domInteractive: 400.4,
    domContentLoadedEventEnd: 450.55,
    loadEventEnd: 800.05,
    transferSize: 1024,
    encodedBodySize: 900,
    decodedBodySize: 3000
  }), {
    ttfb: 120.3,
    domInteractive: 400.4,
    domContentLoaded: 450.6,
    load: 800.1,
    transferSize: 1024,
    encodedBodySize: 900,
    decodedBodySize: 3000
  });
});

test('groups resources by initiator type', () => {
  assert.deepEqual(summarizeResources([
    { initiatorType: 'script', transferSize: 1000, duration: 20.25 },
    { initiatorType: 'script', transferSize: 500, duration: 10.25 },
    { initiatorType: 'img', transferSize: 2500, duration: 30 }
  ]), {
    count: 3,
    transferSize: 4000,
    byType: {
      script: { count: 2, transferSize: 1500, totalDuration: 30.5 },
      img: { count: 1, transferSize: 2500, totalDuration: 30 }
    }
  });
});

test('monitor contains no telemetry transport', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'assets', 'js', 'performance-monitor.js'),
    'utf8'
  );

  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /XMLHttpRequest/);
  assert.doesNotMatch(source, /sendBeacon/);
  assert.doesNotMatch(source, /\.innerHTML\s*=/);
  assert.match(source, /massalia-performance-snapshot/);
  assert.equal(roundMetric(Number.NaN), null);
});

test('default test command includes performance regressions', () => {
  const packageJson = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'package.json'),
    'utf8'
  ));

  assert.match(packageJson.scripts.test, /npm run test:performance/);
});

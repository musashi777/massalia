/**
 * Passive client-side performance instrumentation for Massalia.
 *
 * - no network requests;
 * - no cookies or persistent storage;
 * - no UI or rendering changes;
 * - snapshots are exposed through window.__MASSALIA_PERF__.
 */

const LONG_TASK_THRESHOLD_MS = 50;
const CLS_SESSION_GAP_MS = 1000;
const CLS_SESSION_MAX_MS = 5000;

function roundMetric(value, precision = 1) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function summarizeLongTasks(entries) {
  const durations = entries
    .map((entry) => Number(entry.duration))
    .filter(Number.isFinite);

  return {
    count: durations.length,
    totalDuration: roundMetric(durations.reduce((sum, duration) => sum + duration, 0)),
    maxDuration: roundMetric(durations.length ? Math.max(...durations) : 0),
    blockingDurationAbove50: roundMetric(
      durations.reduce(
        (sum, duration) => sum + Math.max(0, duration - LONG_TASK_THRESHOLD_MS),
        0
      )
    )
  };
}

function calculateCls(entries) {
  const shifts = entries
    .filter((entry) => !entry.hadRecentInput && Number.isFinite(entry.value))
    .sort((a, b) => a.startTime - b.startTime);

  let maximumSessionValue = 0;
  let sessionValue = 0;
  let sessionStart = 0;
  let previousShiftTime = 0;

  for (const shift of shifts) {
    const startsNewSession = sessionValue === 0
      || shift.startTime - previousShiftTime > CLS_SESSION_GAP_MS
      || shift.startTime - sessionStart > CLS_SESSION_MAX_MS;

    if (startsNewSession) {
      sessionStart = shift.startTime;
      sessionValue = shift.value;
    } else {
      sessionValue += shift.value;
    }

    previousShiftTime = shift.startTime;
    maximumSessionValue = Math.max(maximumSessionValue, sessionValue);
  }

  return roundMetric(maximumSessionValue, 4);
}

function summarizeInteractions(entries) {
  const interactions = new Map();

  for (const entry of entries) {
    const interactionId = Number(entry.interactionId);
    const duration = Number(entry.duration);
    if (!interactionId || !Number.isFinite(duration)) continue;

    interactions.set(
      interactionId,
      Math.max(interactions.get(interactionId) || 0, duration)
    );
  }

  const durations = [...interactions.values()].sort((a, b) => b - a);
  return {
    interactionCount: durations.length,
    maxDuration: roundMetric(durations[0] || 0),
    inpCandidate: durations.length
      ? roundMetric(durations[Math.min(Math.floor(durations.length / 50), durations.length - 1)])
      : null
  };
}

function buildNavigationMetrics(entry) {
  if (!entry) return null;

  return {
    ttfb: roundMetric(entry.responseStart - entry.startTime),
    domInteractive: roundMetric(entry.domInteractive - entry.startTime),
    domContentLoaded: roundMetric(entry.domContentLoadedEventEnd - entry.startTime),
    load: roundMetric(entry.loadEventEnd - entry.startTime),
    transferSize: Number(entry.transferSize) || 0,
    encodedBodySize: Number(entry.encodedBodySize) || 0,
    decodedBodySize: Number(entry.decodedBodySize) || 0
  };
}

function summarizeResources(entries) {
  const byType = {};
  let transferSize = 0;

  for (const entry of entries) {
    const type = entry.initiatorType || 'other';
    const entryTransferSize = Number(entry.transferSize) || 0;
    const entryDuration = Number(entry.duration) || 0;

    if (!byType[type]) {
      byType[type] = { count: 0, transferSize: 0, totalDuration: 0 };
    }

    byType[type].count += 1;
    byType[type].transferSize += entryTransferSize;
    byType[type].totalDuration += entryDuration;
    transferSize += entryTransferSize;
  }

  for (const value of Object.values(byType)) {
    value.totalDuration = roundMetric(value.totalDuration);
  }

  return {
    count: entries.length,
    transferSize,
    byType
  };
}

function createMonitor(browserWindow) {
  const browserPerformance = browserWindow.performance;
  const Observer = browserWindow.PerformanceObserver;
  const longTaskEntries = [];
  const layoutShiftEntries = [];
  const interactionEntries = [];
  const paints = {};
  let lcp = null;

  const supportedEntryTypes = Observer && Array.isArray(Observer.supportedEntryTypes)
    ? [...Observer.supportedEntryTypes]
    : [];

  const supports = (entryType) => supportedEntryTypes.includes(entryType);

  function snapshot() {
    const navigationEntry = browserPerformance.getEntriesByType('navigation')[0];
    const resources = browserPerformance.getEntriesByType('resource');

    return {
      version: 1,
      page: browserWindow.location.pathname,
      collectedAt: new Date().toISOString(),
      supportedEntryTypes,
      navigation: buildNavigationMetrics(navigationEntry),
      paints: { ...paints },
      vitals: {
        lcp,
        cls: calculateCls(layoutShiftEntries),
        ...summarizeInteractions(interactionEntries)
      },
      longTasks: summarizeLongTasks(longTaskEntries),
      resources: summarizeResources(resources),
      transport: 'none'
    };
  }

  function publish() {
    const currentSnapshot = snapshot();
    browserWindow.__MASSALIA_PERF__ = currentSnapshot;

    let output = browserWindow.document.getElementById('massalia-performance-snapshot');
    if (!output) {
      output = browserWindow.document.createElement('script');
      output.id = 'massalia-performance-snapshot';
      output.type = 'application/json';
      browserWindow.document.head.append(output);
    }
    output.textContent = JSON.stringify(currentSnapshot);

    return currentSnapshot;
  }

  function observe(entryType, callback, options = {}) {
    if (!Observer || !supports(entryType)) return;

    try {
      const observer = new Observer((list) => {
        callback(list.getEntries());
        publish();
      });
      observer.observe({ type: entryType, buffered: true, ...options });
    } catch (error) {
      console.warn(`Performance entry type unavailable: ${entryType}`, error);
    }
  }

  for (const entry of browserPerformance.getEntriesByType('paint')) {
    paints[entry.name] = roundMetric(entry.startTime);
  }

  observe('paint', (entries) => {
    for (const entry of entries) paints[entry.name] = roundMetric(entry.startTime);
  });

  observe('largest-contentful-paint', (entries) => {
    const lastEntry = entries.at(-1);
    if (lastEntry) lcp = roundMetric(lastEntry.startTime);
  });

  observe('layout-shift', (entries) => layoutShiftEntries.push(...entries));
  observe('longtask', (entries) => longTaskEntries.push(...entries));
  observe('event', (entries) => interactionEntries.push(...entries), {
    durationThreshold: 40
  });

  browserWindow.addEventListener('load', () => {
    browserWindow.setTimeout(publish, 0);
  }, { once: true });
  browserWindow.addEventListener('pagehide', publish);
  browserWindow.document.addEventListener('visibilitychange', () => {
    if (browserWindow.document.visibilityState === 'hidden') publish();
  });

  browserWindow.getMassaliaPerformanceSnapshot = publish;
  publish();

  return { publish, snapshot };
}

if (
  typeof window !== 'undefined'
  && window.performance
  && typeof window.performance.getEntriesByType === 'function'
) {
  createMonitor(window);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildNavigationMetrics,
    calculateCls,
    createMonitor,
    roundMetric,
    summarizeInteractions,
    summarizeLongTasks,
    summarizeResources
  };
}

const gaussianRandom = (mean: number, stddev: number, min: number = 0) => {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return Math.max(min, z * stddev + mean);
};

const waitFor = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

// Keep mock waits realistic enough to exercise loading states without slowing tests.
const MOCK_REQUEST_LATENCY_MEAN_MS = 750;
const MOCK_REQUEST_LATENCY_STDDEV_MS = 250;
const MOCK_REQUEST_LATENCY_MIN_MS = 50;

export const mockRequestTimeTaken = () =>
  waitFor(
    gaussianRandom(
      MOCK_REQUEST_LATENCY_MEAN_MS,
      MOCK_REQUEST_LATENCY_STDDEV_MS,
      MOCK_REQUEST_LATENCY_MIN_MS,
    ),
  );

export default mockRequestTimeTaken;

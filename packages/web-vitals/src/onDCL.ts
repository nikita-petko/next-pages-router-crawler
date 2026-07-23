export default (onReport: (arg: { name: string; value: number }) => void) => {
  if (window.performance) {
    window.addEventListener('load', () => {
      const [entry] = performance.getEntriesByType('navigation') as [PerformanceNavigationTiming];
      onReport({ name: 'DCL', value: entry.domContentLoadedEventStart });
    });
  }
};

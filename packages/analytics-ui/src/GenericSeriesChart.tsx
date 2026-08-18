import type { FC } from 'react';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { LangOptions } from 'highcharts';
import Highcharts from 'highcharts';
import type { HighchartsReactRefObject } from 'highcharts-react-official';
import HighchartsReact from 'highcharts-react-official';
import clone from 'just-clone';
import { useChartColors } from './color';
import type {
  ChartConstructorTypes,
  ChartDependencyStatus,
  ChartUpdatePolicy,
} from './types/BaseChart';

// Highcharts v12: modules self-register on import (client-side only)
let highchartsModulesPromise: Promise<void> | null = null;
let modulesLoaded = false;
const moduleLoadListeners = new Set<() => void>();
const subscribeToModuleLoad = (listener: () => void) => {
  moduleLoadListeners.add(listener);
  return () => {
    moduleLoadListeners.delete(listener);
  };
};
const getModuleLoadSnapshot = () => modulesLoaded;
const getServerModuleLoadSnapshot = () => false;

const loadHighchartsModules = (): Promise<void> => {
  highchartsModulesPromise ??= Promise.all([
    import('highcharts/modules/boost'),
    import('highcharts/highcharts-more'),
    import('highcharts/modules/map'),
    import('highcharts/modules/annotations'),
    import('highcharts/modules/treemap'),
    import('highcharts/modules/sankey'),
  ]).then(() => {
    modulesLoaded = true;
    moduleLoadListeners.forEach((listener) => listener());
    return undefined;
  });
  return highchartsModulesPromise;
};

// Kick off module loading once during module init (client-only, not in tests)
// Note: Jest's jsdom has window defined, so we also check NODE_ENV to avoid
// dynamic import issues with Jest (requires --experimental-vm-modules otherwise)
if (
  typeof window !== 'undefined' &&
  typeof process !== 'undefined' &&
  process.env?.NODE_ENV !== 'test'
) {
  void loadHighchartsModules().catch(() => undefined);
}

export const langOptions: LangOptions = {
  thousandsSep: ',',
  // Override Highcharts' default SI metric prefixes (`['k', 'M', 'G', 'T', …]`)
  // so the built-in axis/data-label formatter abbreviates large numbers with
  // the same K/M/B/T suffixes used everywhere else in the app (Intl `compact`
  // axes, tooltips, and `formatAbbreviatedNumber`). Without this, billions
  // render as the unfamiliar `2.5G` (giga) instead of `2.5B`.
  numericSymbols: ['K', 'M', 'B', 'T'],
};

type GenericSeriesChartProps = {
  options: Highcharts.Options;
  constructorType?: ChartConstructorTypes;
  showLocalizedTime?: boolean;
  chartUpdatePolicy?: ChartUpdatePolicy;
  onChartDependencyStatus?: (status: ChartDependencyStatus) => void;
};

// Positional flags for `HighchartsReact`'s `updateArgs` prop, forwarded to
// `Chart.update(options, redraw, oneToOne, animation)`. The prop type is a
// mutable tuple, so this stays non-`readonly` to remain assignable.
type HighchartsReactUpdateArgs = [
  boolean /* redraw */,
  boolean /* oneToOne */,
  boolean /* animation */,
];
const nonAnimatedUpdateArgs: HighchartsReactUpdateArgs = [
  true /* redraw */,
  true /* oneToOne */,
  false /* animation */,
];
export const getHighchartsReactUpdateArgs = (
  chartUpdatePolicy: ChartUpdatePolicy,
): HighchartsReactUpdateArgs | undefined =>
  chartUpdatePolicy === 'non-animated' ? nonAnimatedUpdateArgs : undefined;

export const applyChartUpdatePolicyToOptions = (
  options: Highcharts.Options,
  chartUpdatePolicy: ChartUpdatePolicy,
): Highcharts.Options => {
  if (chartUpdatePolicy !== 'non-animated') {
    return options;
  }
  return {
    ...options,
    chart: {
      ...options.chart,
      animation: false,
    },
    plotOptions: {
      ...options.plotOptions,
      series: {
        ...options.plotOptions?.series,
        animation: false,
      },
    },
  };
};

// DO NOT DIRECTLY USE THIS CHART COMPONENT
// This component is a generic chart component that should be used as a base for other chart components
const GenericSeriesChart: FC<GenericSeriesChartProps> = ({
  constructorType,
  options,
  showLocalizedTime,
  chartUpdatePolicy: givenChartUpdatePolicy,
  onChartDependencyStatus,
}) => {
  const chartUpdatePolicy: ChartUpdatePolicy = givenChartUpdatePolicy ?? 'default';
  const modulesReady = useSyncExternalStore(
    subscribeToModuleLoad,
    getModuleLoadSnapshot,
    getServerModuleLoadSnapshot,
  );
  const colors = useChartColors();
  const chartComponentRef = useRef<HighchartsReactRefObject>(null);
  const onChartDependencyStatusRef = useRef(onChartDependencyStatus);

  useLayoutEffect(() => {
    onChartDependencyStatusRef.current = onChartDependencyStatus;
  }, [onChartDependencyStatus]);

  // Load highcharts modules on mount
  useEffect(() => {
    if (modulesLoaded) {
      onChartDependencyStatusRef.current?.({
        dependency: 'highchartsModules',
        status: 'ready',
      });
      return () => {};
    }

    let isMounted = true;
    onChartDependencyStatusRef.current?.({
      dependency: 'highchartsModules',
      status: 'pending',
    });
    void loadHighchartsModules()
      .then(() => {
        if (isMounted) {
          onChartDependencyStatusRef.current?.({
            dependency: 'highchartsModules',
            status: 'ready',
          });
        }
        return undefined;
      })
      .catch((error: unknown) => {
        if (isMounted) {
          onChartDependencyStatusRef.current?.({
            dependency: 'highchartsModules',
            status: 'failed',
            error: error instanceof Error ? error : new Error('Highcharts module loading failed'),
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // INFO(gperkins@ 20220907): Need to setOptions when dependencies change due to Highcharts singleton.
  // Using useMemo to ensure it runs synchronously before render but only when deps change. This is
  // intentionally a side effect rather than a computed value: `useEffect` would run too late
  // (HighchartsReact creates the chart in its own mount effect, which fires before this parent
  // effect), so the global options would not be applied to the first render.
  // oxlint-disable-next-line react/react-compiler -- intentional synchronous-before-render side effect; see note above.
  useMemo(() => {
    Highcharts.setOptions({
      lang: langOptions,
      colors,
      time: showLocalizedTime ? { timezone: undefined } : { timezone: 'UTC' },
    });
  }, [colors, showLocalizedTime]);

  // INFO(yhe-cn@20240319): Deep copy the options to avoid the original data mutation
  const optionsCopy: Highcharts.Options = useMemo(() => {
    const cloneBase = clone(options);
    return applyChartUpdatePolicyToOptions(
      {
        ...cloneBase,
        boost: {
          useGPUTranslations: false,
          // Chart-level boost when there are more than 100 series in the chart
          seriesThreshold: 100,
        },
      },
      chartUpdatePolicy,
    );
  }, [chartUpdatePolicy, options]);
  const updateArgs = useMemo(
    () => getHighchartsReactUpdateArgs(chartUpdatePolicy),
    [chartUpdatePolicy],
  );

  // On touch devices, chart tooltips typically remain visible until the user clicks outside the chart area.
  // This effect uses an IntersectionObserver to hide tooltips when the chart is partially scrolled out of view
  // (when less than 50% of the chart is visible in the viewport)
  useEffect(() => {
    const chartContainer = chartComponentRef.current?.container.current;
    const chart = chartComponentRef.current?.chart;
    if (!chartContainer || !chart) {
      return;
    }

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].intersectionRatio <= 0.5) {
          chart.tooltip?.hide();
        }
      },
      { threshold: 0.5 },
    );
    intersectionObserver.observe(chartContainer);
    // oxlint-disable-next-line typescript/consistent-return -- React effect cleanup returns a function.
    return () => {
      intersectionObserver.disconnect();
    };
  }, []);

  if (!modulesReady) {
    return null;
  }

  return (
    <HighchartsReact
      ref={chartComponentRef}
      highcharts={Highcharts}
      options={optionsCopy}
      constructorType={constructorType}
      updateArgs={updateArgs}
    />
  );
};
export default React.memo(GenericSeriesChart);

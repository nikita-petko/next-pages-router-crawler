import React, { FC, useMemo, useRef, useEffect, useState } from 'react';
import Highcharts, { LangOptions } from 'highcharts';
import HighchartsReact, { HighchartsReactRefObject } from 'highcharts-react-official';
import clone from 'just-clone';

import { ChartConstructorTypes } from './types/BaseChart';
import { useChartColors } from './color';

// Highcharts v12: modules self-register on import (client-side only)
let highchartsModulesPromise: Promise<void> | null = null;
let modulesLoaded = false;

const loadHighchartsModules = (): Promise<void> => {
  if (!highchartsModulesPromise) {
    highchartsModulesPromise = Promise.all([
      import('highcharts/modules/boost'),
      import('highcharts/highcharts-more'),
      import('highcharts/modules/map'),
      import('highcharts/modules/annotations'),
      import('highcharts/modules/treemap'),
    ]).then(() => {
      modulesLoaded = true;
    });
  }
  return highchartsModulesPromise;
};

// Kick off module loading once during module init (client-only, not in tests)
// Note: Jest's jsdom has window defined, so we also check NODE_ENV to avoid
// dynamic import issues with Jest (requires --experimental-vm-modules otherwise)
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (typeof window !== 'undefined' && typeof process !== 'undefined' && process.env?.NODE_ENV !== 'test') {
  loadHighchartsModules();
}

const langOptions: LangOptions = {
  thousandsSep: ',',
};

type GenericSeriesChartProps = {
  options: Highcharts.Options;
  constructorType?: ChartConstructorTypes;
  showLocalizedTime?: boolean;
};

// DO NOT DIRECTLY USE THIS CHART COMPONENT
// This component is a generic chart component that should be used as a base for other chart components
const GenericSeriesChart: FC<GenericSeriesChartProps> = ({
  constructorType,
  options,
  showLocalizedTime,
}) => {
  const [modulesReady, setModulesReady] = useState(modulesLoaded);
  const colors = useChartColors();
  const chartComponentRef = useRef<HighchartsReactRefObject>(null);

  // Load highcharts modules on mount
  useEffect(() => {
    if (modulesLoaded) return () => { };

    let isMounted = true;
    loadHighchartsModules().then(() => {
      if (isMounted) {
        setModulesReady(modulesLoaded);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // INFO(gperkins@ 20220907): Need to setOptions when dependencies change due to Highcharts singleton
  // Using useMemo to ensure it runs synchronously before render but only when deps change
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
    return {
      ...cloneBase,
      boost: {
        useGPUTranslations: false,
        // Chart-level boost when there are more than 100 series in the chart
        seriesThreshold: 100,
      },
    };
  }, [options]);

  // On touch devices, chart tooltips typically remain visible until the user clicks outside the chart area.
  // This effect uses an IntersectionObserver to hide tooltips when the chart is partially scrolled out of view
  // (when less than 50% of the chart is visible in the viewport)
  useEffect(() => {
    const chartContainer = chartComponentRef.current?.container.current;
    const chart = chartComponentRef.current?.chart;
    if (!chartContainer || !chart) {
      return undefined;
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
    return () => intersectionObserver.disconnect();
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
    />
  );
};
export default React.memo(GenericSeriesChart);

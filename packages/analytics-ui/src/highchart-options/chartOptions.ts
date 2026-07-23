import type { ChartOptions } from 'highcharts';
import { useMemo } from 'react';
import type { TTheme } from '@rbx/ui';
import { useTheme } from '@rbx/ui';
import { ChartStyleMode, ChartType } from '../types/BaseChart';
import type { SelectionCallback } from '../useOnSelectChartRegion';
import useOnSelectChartRegion from '../useOnSelectChartRegion';

const getBaseChartOptions = ({
  theme,
  chartType,
  chartStyleMode,
  onSelectChartRegion,
  onChartLoad,
  onChartRender,
}: {
  theme: TTheme;
  chartType: ChartType;
  chartStyleMode: ChartStyleMode;
  onSelectChartRegion?: Highcharts.ChartSelectionCallbackFunction;
  onChartLoad?: Highcharts.ChartLoadCallbackFunction;
  onChartRender?: Highcharts.ChartRenderCallbackFunction;
}) => {
  let height: number | undefined;
  switch (chartStyleMode) {
    case ChartStyleMode.Normal: {
      height = 360;
      break;
    }
    case ChartStyleMode.Minimal: {
      height = 205;
      break;
    }
    default: {
      const exhaustiveCheck: never = chartStyleMode;
      throw new Error(`Unhandle ChartStyleMode ${exhaustiveCheck}`);
    }
  }
  return {
    type: chartType,
    zoomType: chartType === ChartType.Map || chartType === ChartType.Bar ? 'none' : 'x',
    backgroundColor: 'transparent',
    style: {
      fontFamily: theme.typography.fontFamily,
    },
    events: {
      selection: onSelectChartRegion,
      load: onChartLoad,
      render: onChartRender,
    },
    animation: true,
    height,
  };
};

const spacingOptions: Pick<
  ChartOptions,
  'spacingTop' | 'spacingRight' | 'spacingBottom' | 'spacingLeft'
> = {
  spacingTop: 10,
  spacingRight: 8,
  spacingBottom: 0,
  spacingLeft: 8,
};

export const useLineChartChartOptions = <X>({
  chartStyleMode,
  onSelectChartRegion: givenOnSelectChartRegion,
  onChartLoad,
  onChartRender,
  height: givenHeight,
}: {
  chartStyleMode: ChartStyleMode;
  onSelectChartRegion?: SelectionCallback<X>;
  onChartLoad?: Highcharts.ChartLoadCallbackFunction;
  onChartRender?: Highcharts.ChartRenderCallbackFunction;
  height?: number;
}): ChartOptions => {
  const theme = useTheme();
  const onSelectChartRegion = useOnSelectChartRegion(givenOnSelectChartRegion);

  const baseChartOptions = useMemo(
    () =>
      getBaseChartOptions({
        theme,
        chartType: ChartType.Spline,
        chartStyleMode,
        onSelectChartRegion,
        onChartLoad,
        onChartRender,
      }),
    [chartStyleMode, onChartLoad, onChartRender, onSelectChartRegion, theme],
  );

  return useMemo(
    () => ({
      ...baseChartOptions,
      ...spacingOptions,
      height: givenHeight || baseChartOptions.height,
    }),
    [baseChartOptions, givenHeight],
  );
};

export const useAreaChartChartOptions = <X>({
  chartStyleMode,
  onSelectChartRegion: givenOnSelectChartRegion,
  onChartLoad,
  onChartRender,
  height: givenHeight,
}: {
  chartStyleMode: ChartStyleMode;
  onSelectChartRegion?: SelectionCallback<X>;
  onChartLoad?: Highcharts.ChartLoadCallbackFunction;
  onChartRender?: Highcharts.ChartRenderCallbackFunction;
  height?: number;
}): ChartOptions => {
  const theme = useTheme();
  const onSelectChartRegion = useOnSelectChartRegion(givenOnSelectChartRegion);

  const baseChartOptions = useMemo(
    () =>
      getBaseChartOptions({
        theme,
        chartType: ChartType.Area,
        chartStyleMode,
        onSelectChartRegion,
        onChartLoad,
        onChartRender,
      }),
    [chartStyleMode, onChartLoad, onChartRender, onSelectChartRegion, theme],
  );

  return useMemo(
    () => ({
      ...baseChartOptions,
      ...spacingOptions,
      height: givenHeight || baseChartOptions.height,
    }),
    [baseChartOptions, givenHeight],
  );
};

export const useColumnChartChartOptions = <X>({
  chartStyleMode,
  onSelectChartRegion: givenOnSelectChartRegion,
  onChartLoad,
  onChartRender,
  height: givenHeight,
}: {
  chartStyleMode: ChartStyleMode;
  onSelectChartRegion?: SelectionCallback<X>;
  onChartLoad?: Highcharts.ChartLoadCallbackFunction;
  onChartRender?: Highcharts.ChartRenderCallbackFunction;
  height?: number;
}): ChartOptions => {
  const theme = useTheme();
  const onSelectChartRegion = useOnSelectChartRegion(givenOnSelectChartRegion);

  const baseChartOptions = useMemo(
    () =>
      getBaseChartOptions({
        theme,
        chartType: ChartType.Column,
        chartStyleMode,
        onSelectChartRegion,
        onChartLoad,
        onChartRender,
      }),
    [chartStyleMode, onChartLoad, onChartRender, onSelectChartRegion, theme],
  );

  return useMemo(
    () => ({
      ...baseChartOptions,
      ...spacingOptions,
      height: givenHeight || baseChartOptions.height,
    }),
    [baseChartOptions, givenHeight],
  );
};

export const useBarChartChartOptions = ({
  chartStyleMode,
  onChartLoad,
  height: givenHeight,
  longestDataLabelLength,
}: {
  chartStyleMode: ChartStyleMode;
  onChartLoad?: Highcharts.ChartLoadCallbackFunction;
  height?: number;
  longestDataLabelLength: number;
}): ChartOptions => {
  const theme = useTheme();
  const baseChartOptions = useMemo(
    () =>
      getBaseChartOptions({
        theme,
        chartType: ChartType.Bar,
        chartStyleMode,
        onChartLoad,
      }),
    [chartStyleMode, onChartLoad, theme],
  );

  return useMemo(
    () => ({
      ...baseChartOptions,
      ...spacingOptions,
      height: givenHeight || baseChartOptions.height,
      // leave some room to accommodate data labels
      // approximating 6px per character, the longest data label should have
      // longestDataLabelLength * 6px margin on the right
      marginRight: longestDataLabelLength ? longestDataLabelLength * 6 : undefined,
    }),
    [baseChartOptions, givenHeight, longestDataLabelLength],
  );
};

export const useMapChartChartOptions = ({
  chartStyleMode,
  onChartLoad,
  topoJSONData,
  height: givenHeight,
}: {
  chartStyleMode: ChartStyleMode;
  topoJSONData: Highcharts.TopoJSON;
  onChartLoad?: Highcharts.ChartLoadCallbackFunction;
  height?: number;
}): ChartOptions => {
  const theme = useTheme();
  const baseChartOptions = useMemo(
    () =>
      getBaseChartOptions({
        theme,
        chartType: ChartType.Map,
        chartStyleMode,
        onChartLoad,
      }),
    [chartStyleMode, onChartLoad, theme],
  );

  return useMemo(
    () => ({
      ...baseChartOptions,
      ...spacingOptions,
      map: topoJSONData,
      height: givenHeight || baseChartOptions.height,
    }),
    [baseChartOptions, givenHeight, topoJSONData],
  );
};

export const usePieChartChartOptions = ({
  chartStyleMode,
  onChartLoad,
  height: givenHeight,
}: {
  chartStyleMode: ChartStyleMode;
  onChartLoad?: Highcharts.ChartLoadCallbackFunction;
  height?: number;
}): ChartOptions => {
  const theme = useTheme();
  const baseChartOptions = useMemo(
    () =>
      getBaseChartOptions({
        theme,
        chartType: ChartType.Pie,
        chartStyleMode,
        onChartLoad,
      }),
    [chartStyleMode, onChartLoad, theme],
  );

  return useMemo(
    () => ({
      ...baseChartOptions,
      ...spacingOptions,
      height: givenHeight || baseChartOptions.height,
      // Pie charts don't need zoom functionality
      zoomType: 'none',
    }),
    [baseChartOptions, givenHeight],
  );
};

export const useTreemapChartOptions = ({
  chartStyleMode,
  onChartLoad,
  height: givenHeight,
}: {
  chartStyleMode: ChartStyleMode;
  onChartLoad?: Highcharts.ChartLoadCallbackFunction;
  height?: number;
}): ChartOptions => {
  const theme = useTheme();

  const baseChartOptions = useMemo(
    () =>
      getBaseChartOptions({
        theme,
        chartType: ChartType.Treemap,
        chartStyleMode,
        onChartLoad,
      }),
    [chartStyleMode, onChartLoad, theme],
  );

  return useMemo(
    () => ({
      ...baseChartOptions,
      ...spacingOptions,
      height: givenHeight || baseChartOptions.height,
    }),
    [baseChartOptions, givenHeight],
  );
};

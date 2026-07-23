import type {
  BreadcrumbOptions,
  BreadcrumbsFormatterCallbackFunction,
  PlotTreemapBreadcrumbsOptions,
} from 'highcharts';
import { useCallback, useMemo } from 'react';
import { useTheme } from '@rbx/ui';
import {
  getTextStyleFromTheme,
  getTextStyleWithoutWeightFromThemeInHTML,
} from '../utils/getTextStyleFromTheme';

export const useTreemapBreadcrumbOptions = (): PlotTreemapBreadcrumbsOptions => {
  const theme = useTheme();
  const breadcrumbFormatter: BreadcrumbsFormatterCallbackFunction = useCallback(
    function formatter(options: BreadcrumbOptions) {
      const { levelOptions } = options;
      const { name } = levelOptions;
      return `<span style="color: ${theme.palette.content.standard}; ${getTextStyleWithoutWeightFromThemeInHTML(theme, 'body2')}">${name}</span>`;
    },
    [theme],
  );
  return useMemo(
    () => ({
      useHTML: true,
      // NOTE(yukihe, 01/22/2026): breadcrumb item is composed of a button element and a text element,
      // need both formatter and buttonTheme to override the highcharts default styles
      formatter: breadcrumbFormatter,
      showFullPath: true,
      buttonTheme: {
        fill: 'transparent',
        stroke: theme.palette.content.standard,
        style: {
          color: theme.palette.content.standard,
          ...getTextStyleFromTheme(theme, 'body2'),
          textDecoration: 'none',
        },
        states: {
          hover: {
            fill: 'transparent',
            stroke: theme.palette.content.standard,
            style: {
              ...getTextStyleFromTheme(theme, 'body2'),
              textDecoration: 'underline',
            },
          },
        },
      },
    }),
    [breadcrumbFormatter, theme],
  );
};

export default useTreemapBreadcrumbOptions;

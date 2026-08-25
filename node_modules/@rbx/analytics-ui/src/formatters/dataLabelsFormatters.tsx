import React, { useCallback } from 'react';
import type { DataLabelsFormatterCallbackFunction, Point } from 'highcharts';
import Highcharts from 'highcharts';
import type { TIconProps } from '@rbx/ui';
import { makeStyles, useTheme } from '@rbx/ui';
import { getTreemapLabelColor } from '../color';
import { escapeHtmlString } from '../utils/escape-html';
import { getTextStyleFromThemeInHTML } from '../utils/getTextStyleFromTheme';
import useReactRenderedRawHtml from '../utils/useReactRenderedRawHtml';
import UnicodeTokensForChartFormatters from './unicodeTokensForChartFormatters';

const useStyles = makeStyles()((theme) => ({
  iconStyle: {
    fill: theme.palette.content.standard,
    verticalAlign: 'bottom',
  },
}));

const highchartsSkipDataLabelToken = '';

type PointMetadata = {
  category: string;
  percentage?: number;
};

export type DataLabelsFormatter = ({
  y,
  category,
  seriesName,
  percentage,
}: {
  y: number;
  category: string;
  seriesName: string;
  percentage?: number;
}) => string | number;

const useCommonDataLabelFormatter = ({
  formatDataLabel,
  LeadingIcon,
  getPointMetadata,
}: {
  formatDataLabel?: DataLabelsFormatter;
  LeadingIcon?: React.FC<TIconProps>;
  getPointMetadata: (point: Point) => PointMetadata | null;
}): DataLabelsFormatterCallbackFunction => {
  const {
    classes: { iconStyle },
  } = useStyles();

  const renderIcon = useCallback(() => {
    return LeadingIcon !== undefined ? (
      <LeadingIcon color='inherit' fontSize='small' classes={{ root: iconStyle }} />
    ) : null;
  }, [LeadingIcon, iconStyle]);

  const view = useReactRenderedRawHtml(renderIcon);
  // Highcharts uses abstract syntax tree to filter out most HTML tags
  // bypass it by viewBox to allowed attributes so icon can be properly sized
  if (view) {
    Highcharts.pushUnique(Highcharts.AST.allowedAttributes, 'viewBox');
  }

  return useCallback(
    function formatter(this: Point) {
      const { y, series } = this;
      if (y === null || y === undefined) {
        return highchartsSkipDataLabelToken;
      }

      const pointMetadata = getPointMetadata(this);
      if (pointMetadata === null) {
        return highchartsSkipDataLabelToken;
      }

      const rawFormattedValue = formatDataLabel
        ? formatDataLabel({ y, ...pointMetadata, seriesName: series.name })
        : `${y}`;
      // `formatDataLabel` receives `category` (from `point.name`) and
      // `seriesName`, both of which can originate from untrusted data. The
      // result is rendered via Highcharts' `useHTML: true` in plotOptions, so
      // HTML-escape before interpolation to prevent stored XSS. `view` is the
      // developer-controlled leading-icon SVG produced by React; it is
      // intentionally left un-escaped.
      const safeFormattedValue = escapeHtmlString(String(rawFormattedValue));

      return view
        ? `${view}${UnicodeTokensForChartFormatters.WhiteSpace}${safeFormattedValue}`
        : safeFormattedValue;
    },
    [formatDataLabel, view, getPointMetadata],
  );
};

export const useBarChartDataLabelsFormatter = ({
  formatDataLabel,
  LeadingIcon,
}: {
  formatDataLabel?: DataLabelsFormatter;
  LeadingIcon?: React.FC<TIconProps>;
}): DataLabelsFormatterCallbackFunction => {
  const getPointMetadata = useCallback((point: Point): PointMetadata | null => {
    const category = point.name;
    if (!category) {
      return null;
    }
    return { category };
  }, []);

  return useCommonDataLabelFormatter({
    formatDataLabel,
    LeadingIcon,
    getPointMetadata,
  });
};

export const usePieChartDataLabelsFormatter = ({
  formatDataLabel,
  LeadingIcon,
}: {
  formatDataLabel?: DataLabelsFormatter;
  LeadingIcon?: React.FC<TIconProps>;
}): DataLabelsFormatterCallbackFunction => {
  const getPointMetadata = useCallback((point: Point): PointMetadata | null => {
    const category = point.name;
    if (!category) {
      return null;
    }
    return {
      category,
      percentage: point.percentage,
    };
  }, []);

  return useCommonDataLabelFormatter({
    formatDataLabel,
    LeadingIcon,
    getPointMetadata,
  });
};

// Treemap points have additional properties not in base Point type
type TreemapPointContext = Point & { node?: { children?: unknown[] }; colorValue?: number };

const DARK_TEXT_COLOR_VALUE_THRESHOLD = 0.05;

export const useTreemapDataLabelsFormatter = ({
  formatDataLabel,
}: {
  formatDataLabel?: DataLabelsFormatter;
}): DataLabelsFormatterCallbackFunction => {
  const theme = useTheme();
  return useCallback(
    function formatter(this: TreemapPointContext) {
      const { name, value, series, node, colorValue } = this;
      if (!name) {
        return highchartsSkipDataLabelToken;
      }
      const isLeaf = !node?.children || node.children.length === 0;

      const textColor =
        colorValue !== undefined && colorValue < DARK_TEXT_COLOR_VALUE_THRESHOLD
          ? getTreemapLabelColor(theme, 'inverse')
          : getTreemapLabelColor(theme, 'standard');
      const colorStyle = `color: ${textColor};`;

      // `name`, `value`, and `series.name` can all originate from untrusted
      // data (e.g. experience names surfaced as treemap categories), and the
      // output of this formatter is injected into the DOM via Highcharts'
      // `useHTML: true`. Escape every dynamic value interpolated into the
      // returned HTML to prevent stored XSS.
      const safeName = escapeHtmlString(name);

      // Leaf node - show name + value (treemap points use `value` instead of `y`)
      if (isLeaf && value !== undefined && value !== null) {
        const rawFormattedValue = formatDataLabel
          ? formatDataLabel({
              y: value,
              category: name,
              seriesName: series.name,
            })
          : `${value}`;
        const safeFormattedValue = escapeHtmlString(String(rawFormattedValue));

        const commonStyles = `${colorStyle} text-overflow: ellipsis; width: 100%; display: inline-block; overflow: hidden;`;

        const nameHtml =
          name !== 'Other'
            ? `<span style="${commonStyles} ${getTextStyleFromThemeInHTML(theme, 'chip')}">${safeName}</span><br>`
            : '';
        return `${nameHtml}<span style="${commonStyles} ${getTextStyleFromThemeInHTML(theme, 'caption')} ">${safeFormattedValue}</span>`;
      }

      // Parent node - show name only as header
      return `<div style="padding-top: 4px; ${getTextStyleFromThemeInHTML(theme, 'chip')}">${safeName}</div>`;
    },
    [formatDataLabel, theme],
  );
};

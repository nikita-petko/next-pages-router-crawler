import { TTheme } from '@rbx/ui';
import { SeriesSplineOptions, SeriesZonesOptionsObject } from 'highcharts';
import {
  LineChartLastZoneAnnotation,
  LineChartZoneAnnotation,
  LineChartZones,
} from '../types/LineChart';
import { SeriesDataTypes } from '../types/BaseChart';
import { getLineStyleOptionsByDataType } from './seriesStylesOptions';

const getLineChartZonesOptions = (
  theme: TTheme,
  zones: LineChartZones,
  baseType: SeriesDataTypes,
): Pick<SeriesSplineOptions, 'zones' | 'zoneAxis'> => {
  if (!zones.length) return {};
  const result: Array<SeriesZonesOptionsObject> = [];
  const { color: baseColor, dashStyle: baseDashStyle } = getLineStyleOptionsByDataType(
    theme,
    baseType,
  );
  zones.forEach(
    ({ start, end, type }: LineChartZoneAnnotation | LineChartLastZoneAnnotation, idx) => {
      result.push({
        value: start, // until start, use base styles
        color: baseColor,
        dashStyle: baseDashStyle,
      });
      const { color, dashStyle } = getLineStyleOptionsByDataType(theme, type);
      if (end) {
        // if there is an end to the range, use this style until that point
        result.push({
          value: end,
          color,
          dashStyle,
        });
      } else if (idx < zones.length - 1) {
        throw new Error('Can only have multiple zones when all but the last one have an `end`.');
      } else {
        // this is the last one, and `value: undefined` tells highcharts to use this style for the remainder
        result.push({
          color,
          dashStyle,
        });
      }
    },
  );
  return { zones: result, zoneAxis: 'x' };
};

export default getLineChartZonesOptions;

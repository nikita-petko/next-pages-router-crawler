import type { CSVData } from '@rbx/core';
import { compileCSV } from '@rbx/core';
import type { Locale } from '@rbx/intl';
import type {
  FormattedText,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { formatDateRangeForKey } from '../../utils/dateUtils';
import type { TExplicitTimeRangeSpec } from '../types/ChartTypes';
import type { TimeComparatorChartSpec } from '../types/TimeComparatorTypes';
import type { TimeSeriesChartUnitSpec, TimeSeriesInfo } from '../types/TimeSeriesTypes';
import GenericChartExporter from './GenericChartExporter';
import { escapeFileName } from './GenericCsvExporter';

class TimeComparatorChartExporter extends GenericChartExporter<
  TimeComparatorChartSpec<TimeSeriesInfo>
> {
  // We need to get the Locale from the React component in order to localize the dates
  constructor(
    exportMetricLabel: FormattedText,
    chart: {
      timeAnnotatedSeries: {
        timeSpec: TExplicitTimeRangeSpec;
        series: TimeSeriesInfo;
      }[];
      unit: TimeSeriesChartUnitSpec;
    },
    translate: TranslationKeyToFormattedText,
    protected readonly locale: Locale,
    fileNamePrefix?: string,
  ) {
    super(exportMetricLabel, chart, translate, fileNamePrefix);
  }

  protected generateCSV(): CSVData {
    const lines: string[][] = [];

    // column headers
    lines.push([
      this.translate(translationKey('Label.TimePeriod', TranslationNamespace.Analytics)),
      this.translate(translationKey('Label.Date', TranslationNamespace.Analytics)),
      this.chart.unit.display,
    ]);

    this.chart.timeAnnotatedSeries.forEach(({ series, timeSpec }) => {
      const seriesLabel = series.name
        ? `${formatDateRangeForKey(this.locale, timeSpec.startTime, timeSpec.endTime)} (${series.name})`
        : formatDateRangeForKey(this.locale, timeSpec.startTime, timeSpec.endTime);
      series.dataPoints.forEach(([t, v]) => {
        lines.push([seriesLabel, new Date(t).toISOString(), `${v}`]);
      });
    });

    return compileCSV(lines);
  }

  protected getExportFilename(): string {
    const prefix = this.fileNamePrefix ? `${this.fileNamePrefix}: ` : '';
    const unescaped = `${prefix}${this.exportMetricLabel} ${this.translate(translationKey('Heading.Compare', TranslationNamespace.Analytics))}`;
    const escaped = escapeFileName(unescaped);
    return `${escaped}.csv`;
  }

  get hasEmptyData(): boolean {
    return (
      !this.chart.timeAnnotatedSeries.length ||
      !this.chart.timeAnnotatedSeries[0].series.dataPoints.length
    );
  }
}

export default TimeComparatorChartExporter;

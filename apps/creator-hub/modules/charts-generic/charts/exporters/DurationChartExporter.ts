import { compileCSV, CSVData } from '@rbx/core';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey, TranslationKeyToFormattedText } from '@modules/analytics-translations';
import {
  DurationBucketTypeToTranslationKey,
  DurationSplineChartSpec,
} from '../types/DurationSplineChartTypes';
import GenericChartExporter, { type ExportMetricLabel } from './GenericChartExporter';
import { escapeFileName } from './GenericCsvExporter';

class DurationChartExporter extends GenericChartExporter<DurationSplineChartSpec> {
  constructor(
    exportMetricLabel: ExportMetricLabel,
    chart: DurationSplineChartSpec,
    translate: TranslationKeyToFormattedText,
    protected readonly queryDate: { startTime: Date; endTime: Date },
    protected readonly extraInfoAboveTabel?: string[],
    fileNamePrefix?: string,
  ) {
    super(exportMetricLabel, chart, translate, fileNamePrefix);
  }

  protected generateCSV(): CSVData {
    const { bucketType, unit } = this.chart;

    const lines: string[][] = [];
    if (this.extraInfoAboveTabel) {
      lines.push(this.extraInfoAboveTabel);
      lines.push([]); // push an empty line to separate the extra info from the table
    }

    lines.push([
      this.translate(translationKey('Label.Breakdown', TranslationNamespace.Analytics)),
      this.translate(DurationBucketTypeToTranslationKey[bucketType]),
      unit.display,
    ]);

    this.chart.series.forEach((series) => {
      const { name, dataPoints: seriesData } = series;
      seriesData.forEach(([bucket, value]) => {
        lines.push([name, `${bucket}`, `${value}`]);
      });
    });
    return compileCSV(lines);
  }

  protected getExportFilename(): string {
    const { startTime, endTime } = this.queryDate;

    const prefix = this.fileNamePrefix ? `${this.fileNamePrefix}: ` : '';
    const unescaped = `${prefix}${this.exportMetricLabel}, ${startTime.toISOString()} to ${endTime.toISOString()}`;
    const escaped = escapeFileName(unescaped);
    return `${escaped}.csv`;
  }

  get hasEmptyData(): boolean {
    return !this.chart.series.length || !this.chart.series[0].dataPoints.length;
  }
}

export default DurationChartExporter;

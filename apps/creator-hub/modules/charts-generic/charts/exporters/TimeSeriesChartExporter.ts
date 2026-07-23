import { compileCSV, CSVData } from '@rbx/core';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey } from '@modules/analytics-translations';
import { GenericTimeSeriesChartSpec } from '../types/TimeSeriesTypes';
import GenericChartExporter from './GenericChartExporter';
import { escapeFileName } from './GenericCsvExporter';

class TimeSeriesChartExporter extends GenericChartExporter<GenericTimeSeriesChartSpec> {
  protected generateCSV(): CSVData {
    const lines: string[][] = [];

    // column headers
    lines.push([
      this.translate(translationKey('Label.Breakdown', TranslationNamespace.Analytics)),
      this.translate(translationKey('Label.Date', TranslationNamespace.Analytics)),
      this.chart.unit.display,
    ]);

    this.chart.series.forEach(({ name, dataPoints }) => {
      dataPoints.forEach(([t, v]) => {
        lines.push([name, new Date(t).toISOString(), `${v}`]);
      });
    });

    return compileCSV(lines);
  }

  protected getExportFilename(): string {
    const { timestamps } = this.chart;
    const startDate = new Date(timestamps[0]);
    const endDate = new Date(timestamps[timestamps.length - 1]);

    const prefix = this.fileNamePrefix ? `${this.fileNamePrefix}: ` : '';
    const unescaped = `${prefix}${this.exportMetricLabel}, ${startDate.toISOString()} to ${endDate.toISOString()}`;
    const escaped = escapeFileName(unescaped);
    return `${escaped}.csv`;
  }

  get hasEmptyData(): boolean {
    return !this.chart.series.some((s) => s.dataPoints.length > 0);
  }
}

export default TimeSeriesChartExporter;

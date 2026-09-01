import type { CSVData } from '@rbx/core';
import { compileCSV } from '@rbx/core';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import GenericChartExporter from '@modules/charts-generic/charts/exporters/GenericChartExporter';
import { escapeFileName } from '@modules/charts-generic/charts/exporters/GenericCsvExporter';
import type { GenericTimeSeriesChartSpec } from '@modules/charts-generic/charts/types/TimeSeriesTypes';
import { AnalyticsDataStatus } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const SETTLEMENT_DAYS = 60;

class CreatorRewardsTimeSeriesChartExporter extends GenericChartExporter<GenericTimeSeriesChartSpec> {
  protected generateCSV(): CSVData {
    const { unit, series } = this.chart;
    const lines: string[][] = [];

    const translatedUnitDisplay =
      unit.display.length > 0
        ? unit.display
        : this.translate(translationKey('Label.RobuxEarnings', TranslationNamespace.Analytics));

    // column headers
    lines.push([
      this.translate(translationKey('Label.Breakdown', TranslationNamespace.Analytics)),
      this.translate(translationKey('Label.EngagementDate', TranslationNamespace.Analytics)),
      this.translate(translationKey('Label.SettlementDate', TranslationNamespace.Analytics)),
      this.translate(translationKey('Label.SeriesDataTypesStatus', TranslationNamespace.Analytics)),
      translatedUnitDisplay,
    ]);

    series.forEach(({ name, dataPoints }) => {
      dataPoints.forEach(([t, v, status]) => {
        const date = new Date(t);
        const settledDate = new Date(date);

        settledDate.setDate(settledDate.getDate() + SETTLEMENT_DAYS);

        const dataStatus = status ?? AnalyticsDataStatus.Projected;
        const translatedTimestampDataStatus =
          dataStatus === AnalyticsDataStatus.Valid
            ? this.translate(translationKey('Label.Settled', TranslationNamespace.Analytics))
            : this.translate(translationKey('Label.Estimated', TranslationNamespace.Analytics));

        lines.push([
          name,
          date.toISOString(),
          settledDate.toISOString(),
          translatedTimestampDataStatus,
          `${v}`,
        ]);
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
    return !this.chart.series.length || !this.chart.series[0].dataPoints.length;
  }
}

export default CreatorRewardsTimeSeriesChartExporter;

import type { CSVData } from '@rbx/core';
import { compileCSV } from '@rbx/core';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import GenericChartExporter from '@modules/charts-generic/charts/exporters/GenericChartExporter';
import { escapeFileName } from '@modules/charts-generic/charts/exporters/GenericCsvExporter';
import type {
  TimeSeriesChartUnitSpec,
  TimeSeriesInfo,
} from '@modules/charts-generic/charts/types/TimeSeriesTypes';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type AnnouncementCompareChartSpec = {
  labeledSeries: Array<{
    seriesLabel: string;
    series: TimeSeriesInfo;
  }>;
  unit: TimeSeriesChartUnitSpec;
};

class AnnouncementCompareChartExporter extends GenericChartExporter<AnnouncementCompareChartSpec> {
  protected generateCSV(): CSVData {
    const lines: string[][] = [];

    lines.push([
      this.translate(translationKey('Label.Announcement', TranslationNamespace.Community)),
      this.translate(translationKey('Description.DayNumber', TranslationNamespace.Analytics), {
        number: '',
      }).trim(),
      this.chart.unit.display || this.exportMetricLabel,
    ]);

    this.chart.labeledSeries.forEach(({ seriesLabel, series }) => {
      series.dataPoints.forEach(([dayNum, value]) => {
        const dayLabel = this.translate(
          translationKey('Description.DayNumber', TranslationNamespace.Analytics),
          { number: dayNum.toString() },
        );
        lines.push([seriesLabel, dayLabel, `${value}`]);
      });
    });

    return compileCSV(lines);
  }

  protected getExportFilename(): string {
    const prefix = this.fileNamePrefix ? `${this.fileNamePrefix}: ` : '';
    const unescaped = `${prefix}${this.exportMetricLabel} ${this.translate(translationKey('Heading.Compare', TranslationNamespace.Analytics))}`;
    return `${escapeFileName(unescaped)}.csv`;
  }

  get hasEmptyData(): boolean {
    return (
      !this.chart.labeledSeries.length ||
      this.chart.labeledSeries.every((s) => !s.series.dataPoints.length)
    );
  }
}

export default AnnouncementCompareChartExporter;

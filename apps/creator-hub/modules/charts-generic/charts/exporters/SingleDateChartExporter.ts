import { compileCSV, CSVData } from '@rbx/core';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { FormattedText, TranslationKey, translationKey } from '@modules/analytics-translations';
import { ChartUnitFormatted } from '../types/ChartTypes';
import GenericChartExporter from './GenericChartExporter';
import { escapeFileName } from './GenericCsvExporter';

type SingleDateDatapointForExport = {
  name: FormattedText;
  y: number;
};

type SingleDateSeriesChartSpec = {
  series: {
    name: FormattedText;
    data: SingleDateDatapointForExport[];
  }[];
  date: Date;
  unit: ChartUnitFormatted;
  breakColumnHeaderKey: TranslationKey;
};

class SingleDateChartExporter extends GenericChartExporter<SingleDateSeriesChartSpec> {
  protected generateCSV(): CSVData {
    const { date, series, unit, breakColumnHeaderKey } = this.chart;
    const lines: string[][] = [];

    lines.push([
      this.translate(translationKey('Label.Date', TranslationNamespace.Analytics)),
      date.toISOString(),
    ]);

    lines.push([
      this.translate(breakColumnHeaderKey),
      this.translate(translationKey('Label.Series', TranslationNamespace.Analytics)),
      unit.display,
    ]);

    series.forEach((singleSeries) => {
      const { name: seriesName, data } = singleSeries;
      data.forEach((dataPoint) => {
        lines.push([dataPoint.name, seriesName, `${dataPoint.y}`]);
      });
    });
    return compileCSV(lines);
  }

  protected getExportFilename(): string {
    const { date, breakColumnHeaderKey } = this.chart;

    const prefix = this.fileNamePrefix ? `${this.fileNamePrefix}: ` : '';
    const unescaped = `${prefix}${this.exportMetricLabel}, ${this.translate(breakColumnHeaderKey)}, ${date.toISOString()}`;
    const escaped = escapeFileName(unescaped);

    return `${escaped}.csv`;
  }

  get hasEmptyData(): boolean {
    return !this.chart.series.length || !this.chart.series[0].data.length;
  }
}

export default SingleDateChartExporter;

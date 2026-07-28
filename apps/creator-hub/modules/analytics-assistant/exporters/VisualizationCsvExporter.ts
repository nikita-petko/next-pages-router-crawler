import type { CSVData } from '@rbx/core';
import { compileCSV } from '@rbx/core';
import type { TranslationKeyToFormattedText } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import GenericCsvExporter, {
  escapeFileName,
} from '@modules/charts-generic/charts/exporters/GenericCsvExporter';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type {
  VisualizationBarChartElement,
  VisualizationChartElement,
  VisualizationColumnChartElement,
  VisualizationTableElement,
} from '../types/AssistantVisualizationChartElement';

class VisualizationCsvExporter extends GenericCsvExporter {
  constructor(
    private readonly element: VisualizationChartElement,
    private readonly translate: TranslationKeyToFormattedText,
  ) {
    super();
  }

  get hasEmptyData(): boolean {
    switch (this.element.type) {
      case ChartType.Spline:
        return !this.element.data.series.some((series) => series.dataPoints.length > 0);
      case ChartType.Area:
        return !this.element.data.series.some((series) => series.dataPoints.length > 0);
      case ChartType.Bar:
        return !this.element.data.series.some((series) => series.dataPoints.length > 0);
      case ChartType.Column:
        return !this.element.data.series.some((series) => series.dataPoints.length > 0);
      case ChartType.Pie:
        return this.element.data.series.dataPoints.length === 0;
      case ChartType.Table:
        return this.element.rows.length === 0;
      default:
        return assertUnhandledVisualizationElement(this.element);
    }
  }

  protected generateCSV(): CSVData {
    switch (this.element.type) {
      case ChartType.Spline: {
        const range = this.element.data.range;
        return compileCSV([
          this.seriesDateValueHeaders,
          ...this.element.data.series.flatMap((series) =>
            series.dataPoints.map(([timestamp, value]) => [
              series.name,
              new Date(timestamp).toISOString(),
              formatCsvValue(value),
            ]),
          ),
          ...(range
            ? range.bottomDataPoints.map(([timestamp, lower], index) => [
                range.name,
                new Date(timestamp).toISOString(),
                [formatCsvValue(lower), formatCsvValue(range.topDataPoints[index]?.[1])]
                  .filter(Boolean)
                  .join(' - '),
              ])
            : []),
        ]);
      }
      case ChartType.Area:
        return compileCSV([
          this.seriesDateValueHeaders,
          ...this.element.data.series.flatMap((series) =>
            series.dataPoints.map(([timestamp, value]) => [
              series.name,
              new Date(timestamp).toISOString(),
              formatCsvValue(value),
            ]),
          ),
        ]);
      case ChartType.Bar:
        return this.generateCategoricalCSV(this.element);
      case ChartType.Column:
        return this.generateCategoricalCSV(this.element);
      case ChartType.Pie:
        return compileCSV([
          [this.breakdownHeader, this.valueHeader],
          ...this.element.data.series.dataPoints.map(([slice, value]) => [
            slice,
            formatCsvValue(value),
          ]),
        ]);
      case ChartType.Table:
        return generateTableCSV(this.element);
      default:
        return assertUnhandledVisualizationElement(this.element);
    }
  }

  protected getExportFilename(): string {
    return `${escapeFileName(this.element.title)}.csv`;
  }

  private get breakdownHeader(): string {
    return this.translate(translationKey('Label.Breakdown', TranslationNamespace.Analytics));
  }

  private get dateHeader(): string {
    return this.translate(translationKey('Label.Date', TranslationNamespace.Analytics));
  }

  private get seriesDateValueHeaders(): string[] {
    return [this.seriesHeader, this.dateHeader, this.valueHeader];
  }

  private get seriesHeader(): string {
    return this.translate(translationKey('Label.Series', TranslationNamespace.Analytics));
  }

  private get valueHeader(): string {
    return this.translate(translationKey('Label.Value', TranslationNamespace.Analytics));
  }

  private generateCategoricalCSV(
    element: VisualizationBarChartElement | VisualizationColumnChartElement,
  ): CSVData {
    return compileCSV([
      [this.seriesHeader, this.breakdownHeader, this.valueHeader],
      ...element.data.series.flatMap((series) =>
        series.dataPoints.map(([category, value]) => [
          series.name,
          category,
          formatCsvValue(value),
        ]),
      ),
    ]);
  }
}

function generateTableCSV(element: VisualizationTableElement): CSVData {
  return compileCSV([
    element.columns.map((column) => column.title),
    ...element.rows.map((row) =>
      element.columns.map((column) => formatCsvValue(row.cells[column.key])),
    ),
  ]);
}

function formatCsvValue(value: string | number | boolean | null | undefined): string {
  if (value == null) {
    return '';
  }
  return String(value);
}

function assertUnhandledVisualizationElement(element: never): never {
  void element;
  throw new Error('Unhandled visualization element');
}

export default VisualizationCsvExporter;

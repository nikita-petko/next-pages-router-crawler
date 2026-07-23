import type { CSVData } from '@rbx/core';
import { compileCSV } from '@rbx/core';
import type {
  FormattedText,
  TranslationKey,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { GenericTimeSeriesChartSpec } from '../types/TimeSeriesTypes';
import GenericChartExporter from './GenericChartExporter';
import { escapeFileName } from './GenericCsvExporter';

const FALLBACK_BREAKDOWN_HEADER_KEY: TranslationKey = translationKey(
  'Label.Breakdown',
  TranslationNamespace.Analytics,
);

class TimeSeriesChartExporter extends GenericChartExporter<GenericTimeSeriesChartSpec> {
  // One translation key per breakdown dimension, in the same order as
  // the underlying spec's `breakdown` array. The CSV header collapses
  // these into a single comma-joined column (e.g.
  // `"Age Group, Operating System"`), matching the comma-joined value
  // cells that `getBreakdownName` produces in each row's series `name`.
  // Empty / omitted falls back to a single "Breakdown" column header,
  // preserving the historic behavior for unbroken charts.
  protected readonly breakColumnHeaderKeys: readonly TranslationKey[];

  constructor(
    exportMetricLabel: FormattedText,
    chart: GenericTimeSeriesChartSpec,
    translate: TranslationKeyToFormattedText,
    fileNamePrefix?: string,
    breakColumnHeaderKeys: readonly TranslationKey[] = [],
  ) {
    super(exportMetricLabel, chart, translate, fileNamePrefix);
    this.breakColumnHeaderKeys = breakColumnHeaderKeys;
  }

  private get effectiveBreakColumnHeaderKeys(): readonly TranslationKey[] {
    return this.breakColumnHeaderKeys.length > 0
      ? this.breakColumnHeaderKeys
      : [FALLBACK_BREAKDOWN_HEADER_KEY];
  }

  protected generateCSV(): CSVData {
    const lines: string[][] = [];

    // Collapse multi-dimension breakdowns into a single column whose
    // header is the comma-joined list of dimension labels (e.g.
    // `"Age Group, Operating System"`). The per-row series `name`
    // is already a comma-joined compound value (built via
    // `getBreakdownName`), so it lines up under that header without
    // any further row transformation. `compileCSV` handles escaping
    // the embedded comma into a quoted cell.
    const joinedBreakdownHeader = this.effectiveBreakColumnHeaderKeys
      .map((key) => this.translate(key))
      .join(', ');

    lines.push([
      joinedBreakdownHeader,
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

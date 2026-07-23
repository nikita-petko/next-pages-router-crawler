import type { CSVData } from '@rbx/core';
import { compileCSV } from '@rbx/core';
import type { FormattedText, TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ChartUnitFormatted } from '../types/ChartTypes';
import GenericChartExporter from './GenericChartExporter';
import { escapeFileName } from './GenericCsvExporter';

type SingleDateDatapointForExport = {
  /**
   * Per-breakdown-dimension labels for this row, indexed parallel to
   * {@link SingleDateSeriesChartSpec.breakColumnHeaderKeys}. The
   * exporter joins these with `", "` into a single CSV cell that lines
   * up under the joined breakdown header (e.g. `["US","iOS"]` ->
   * `"US, iOS"` under `"Country, Platform"`). Empty entries (e.g.
   * Total / Other rows that don't carry per-dimension values) are
   * dropped before joining so the cell stays clean. When the chart has
   * no breakdown, this is a single-element tuple holding the row's
   * display name (typically the series name itself).
   */
  names: readonly FormattedText[];
  y: number;
};

type SingleDateSeriesChartSpec = {
  series: {
    name: FormattedText;
    data: SingleDateDatapointForExport[];
  }[];
  date: Date;
  unit: ChartUnitFormatted;
  /**
   * One header per breakdown dimension, in the same order as the chart
   * spec's `breakdown` array. The exporter joins the translated labels
   * with `", "` into a single breakdown column (e.g. `"Country,
   * Platform"`) so multi-dimension exports read as one compound column
   * instead of one column per dimension. Empty array is treated as
   * "no breakdown" and falls back to a single "Breakdown" header.
   */
  breakColumnHeaderKeys: readonly TranslationKey[];
};

const FALLBACK_BREAKDOWN_HEADER_KEY: TranslationKey = translationKey(
  'Label.Breakdown',
  TranslationNamespace.Analytics,
);

class SingleDateChartExporter extends GenericChartExporter<SingleDateSeriesChartSpec> {
  private get effectiveBreakColumnHeaderKeys(): readonly TranslationKey[] {
    const { breakColumnHeaderKeys } = this.chart;
    // Preserve the historic single-column behavior for unbroken charts —
    // the row's `names[0]` carries the row label (series name / "Total"),
    // and the column header reads "Breakdown".
    return breakColumnHeaderKeys.length > 0
      ? breakColumnHeaderKeys
      : [FALLBACK_BREAKDOWN_HEADER_KEY];
  }

  protected generateCSV(): CSVData {
    const { date, series, unit } = this.chart;
    const headerKeys = this.effectiveBreakColumnHeaderKeys;
    const lines: string[][] = [];

    lines.push([
      this.translate(translationKey('Label.Date', TranslationNamespace.Analytics)),
      date.toISOString(),
    ]);

    // Collapse multi-dimension breakdowns into a single column whose
    // header is the comma-joined list of dimension labels (e.g.
    // `"Age Group, OS"`). Per-row data cells are joined the same way so
    // each compound value lines up under that header. `compileCSV`
    // takes care of escaping the embedded comma into a quoted cell.
    const joinedBreakdownHeader = headerKeys.map((key) => this.translate(key)).join(', ');
    lines.push([
      joinedBreakdownHeader,
      this.translate(translationKey('Label.Series', TranslationNamespace.Analytics)),
      unit.display,
    ]);

    series.forEach(({ name: seriesName, data }) => {
      data.forEach(({ names, y }) => {
        // Drop empty padding cells (e.g. a Total / Other row that
        // carries only the row label and trailing blanks from
        // `buildBreakdownColumnNames`) before joining so the cell
        // reads as `"Total"` rather than `"Total, "`. For normal rows
        // with one label per dimension this is a no-op.
        const joinedBreakdownValue = names.filter((n) => n !== '').join(', ');
        lines.push([joinedBreakdownValue, seriesName, `${y}`]);
      });
    });
    return compileCSV(lines);
  }

  protected getExportFilename(): string {
    const { date } = this.chart;
    const headerKeys = this.effectiveBreakColumnHeaderKeys;

    const prefix = this.fileNamePrefix ? `${this.fileNamePrefix}: ` : '';
    const headerLabel = headerKeys.map((key) => this.translate(key)).join(', ');
    const unescaped = `${prefix}${this.exportMetricLabel}, ${headerLabel}, ${date.toISOString()}`;
    const escaped = escapeFileName(unescaped);

    return `${escaped}.csv`;
  }

  get hasEmptyData(): boolean {
    return !this.chart.series.length || !this.chart.series[0].data.length;
  }
}

export default SingleDateChartExporter;

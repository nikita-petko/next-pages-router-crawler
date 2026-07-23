import { FormattedText, TranslationKeyToFormattedText } from '@modules/analytics-translations';
import { TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import GenericCsvExporter from './GenericCsvExporter';

export const wrapNonRAQIMetricAsFormattedTextForExporter = (metric: string): FormattedText => {
  /**
   * At some point we may want to translate the metric in our exporter, or be
   * able to generate metric descriptions from custom compound metrics.
   *
   * At that point we'll need to wrap these differently from the RAQI metrics,
   * but for now they're just used as strings.
   *
   * This function ensures callsites will not need to change again.
   */
  return metric as FormattedText;
};

/**
 * Export file names can use either a canonical metric id or a preformatted
 * label (e.g. computed metric formula/name).
 * This should almost always be a TRAQIV2UIMetric.
 */
export type ExportMetricLabel = TRAQIV2UIMetric | FormattedText;

abstract class GenericChartExporter<TChartSeriesSpec> extends GenericCsvExporter {
  constructor(
    protected readonly exportMetricLabel: ExportMetricLabel,
    protected readonly chart: TChartSeriesSpec,
    protected readonly translate: TranslationKeyToFormattedText,
    protected readonly fileNamePrefix?: string,
  ) {
    super();
  }
}

export default GenericChartExporter;

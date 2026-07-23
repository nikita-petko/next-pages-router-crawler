import type {
  FormattedText,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations/types';
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
  // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- FormattedText is a phantom brand for already-displayable exporter labels.
  return metric as FormattedText;
};

abstract class GenericChartExporter<TChartSeriesSpec> extends GenericCsvExporter {
  constructor(
    protected readonly exportMetricLabel: FormattedText,
    protected readonly chart: TChartSeriesSpec,
    protected readonly translate: TranslationKeyToFormattedText,
    protected readonly fileNamePrefix?: string,
  ) {
    super();
  }
}

export default GenericChartExporter;

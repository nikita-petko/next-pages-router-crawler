import { MetricTemplateType } from '../types/MetricTemplateType';

/**
 * Display order of the metric set options in the create-experiment dropdown.
 *
 * NOTE: the exact design for this selector is not yet finalized, so the copy is
 * not final and its translation keys are intentionally NOT registered in
 * Translations Hub yet. The option copy + keys live at the call site in
 * `MetricSetSelector` (rendered via `tPendingTranslation`), because the
 * translation-sync tooling can only extract string-literal arguments — it
 * cannot follow values pulled from a data table. Once the design and copy are
 * locked, register the keys and drop the pending helper.
 */
export const METRIC_SET_OPTION_ORDER: readonly MetricTemplateType[] = [
  MetricTemplateType.Default,
  MetricTemplateType.Ads,
  MetricTemplateType.Custom,
];

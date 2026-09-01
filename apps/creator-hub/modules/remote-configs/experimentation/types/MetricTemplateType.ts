/**
 * The metric set (a.k.a. experiment template) a creator can pick for an
 * experiment. Mirrors the `MetricTemplateType` enum in the Custom Metrics &
 * Experiment Templates tech spec (DEFAULT / ADS / CUSTOM).
 *
 * This is UI-only for now — the selection is captured in the create-experiment
 * form but not yet sent to the backend. It is gated behind the
 * `isExperimentationTemplatesEnabled` flag until the full feature is ready.
 */
export enum MetricTemplateType {
  Default = 'Default',
  Ads = 'Ads',
  Custom = 'Custom',
}

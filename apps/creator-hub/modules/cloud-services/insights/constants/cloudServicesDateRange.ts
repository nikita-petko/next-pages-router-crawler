/**
 * CAaaS retains cloud service metrics (DataStore, MemoryStore, MessagingService,
 * HttpService, TextToSpeech, SpeechToText) for 28 days — see
 * `RAQIV2MetricDisplayConfig[metric].retentionDurationDays` in the analytics
 * codegen config.
 *
 * Page `timeRangeOptions` use this for both `maxRangeDays` and
 * `maxStartDateOffsetDays` so a custom range can neither span more than 28 days
 * nor start before the retention cutoff, keeping the picker from offering
 * windows the backend has no data for.
 */
export const CLOUD_SERVICES_METRIC_RETENTION_DAYS = 28;

export default CLOUD_SERVICES_METRIC_RETENTION_DAYS;

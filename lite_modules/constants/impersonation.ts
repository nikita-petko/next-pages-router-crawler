export const DEFAULT_FLAG_VALUE = 'default';

interface ImpersonationFlag {
  configKey: string;
  id: string;
  label: string;
}

export const IMPERSONATION_FLAGS: readonly ImpersonationFlag[] = [
  {
    configKey: 'enable_campaign_roas',
    id: 'campaign-roas',
    label: 'Campaign ROAS',
  },
  {
    configKey: 'enable_custom_date_range',
    id: 'custom-date-range',
    label: 'Custom Date Range',
  },
  {
    configKey: 'enable_attribution_date_aggregation',
    id: 'attribution-date-aggregation',
    label: 'Attribution Date Aggregation',
  },
];

export type FlagValues = Record<string, string>;

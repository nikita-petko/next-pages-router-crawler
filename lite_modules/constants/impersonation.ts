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
];

export type FlagValues = Record<string, string>;

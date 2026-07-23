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
];

export type FlagValues = Record<string, string>;

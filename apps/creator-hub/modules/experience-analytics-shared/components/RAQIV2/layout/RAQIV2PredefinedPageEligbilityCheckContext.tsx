import type { FC } from 'react';
import React from 'react';
import { Grid, Typography } from '@rbx/ui';
import { AnalyticsPageLayout } from '@modules/charts-generic/layout/AnalyticsPageLayout';
import useIsPageContentEligible from '../../../hooks/useIsPageContentEligible';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import type { RAQIV2PageConfig } from '../../../types/RAQIV2PageConfig';
import useRAQIV2PredefinedPageControlsBundle from './useRAQIV2PredefinedPageControlsBundle';

const RAQIV2PredefinedPageEligibilityCheckContext: FC<
  React.PropsWithChildren<{ config: RAQIV2PageConfig; preControlComponentHack?: React.JSX.Element }>
> = ({ config, preControlComponentHack, children }) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { eligibility } = config;
  const { title, description } = useRAQIV2PredefinedPageControlsBundle(config);

  const hasEligibilityConfig = !!eligibility;
  const isEligible = useIsPageContentEligible(eligibility) || !hasEligibilityConfig;

  if (eligibility && !isEligible) {
    return (
      <AnalyticsPageLayout
        title={title}
        description={description}
        heroElement={eligibility.ignorePreControlComponents ? preControlComponentHack : undefined}>
        <Grid item key='ineligibleMessage'>
          <Typography>{translate(eligibility.ineligibleMessage)}</Typography>
        </Grid>
      </AnalyticsPageLayout>
    );
  }
  return children;
};

export default RAQIV2PredefinedPageEligibilityCheckContext;

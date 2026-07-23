import React, { FC } from 'react';
import { Button } from '@rbx/ui';
import { AnalyticsPageLayout } from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { EmptyState, EmptyStateBorder } from '@modules/miscellaneous/common/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import { RAQIV2SpecialLayoutType } from '../../../types/RAQIV2SpecialLayoutConfig';
import { CreatorAnalyticsUntabbedPageConfig } from '../../../types/RAQIV2PageConfig';
import useRAQIV2PredefinedSurfaceControlsBundle from './useRAQIV2PredefinedSurfaceControlsBundle';
import useRAQIV2PredefinedPageControlsBundle from './useRAQIV2PredefinedPageControlsBundle';
import useRAQIV2PredefinedPreControlComponentsBundle from './useRAQIV2PredefinedPreControlComponentsBundle';
import GenericAnalyticsLayoutItem from './GenericAnalyticsLayoutItem';

// Generic short-circuit error state for RAQIV2 pages for when pages have additional requests
// that require us to fail the entire page. This is not a configurable component to allow consumers
// to pass through a retry function.
const RAQIV2GenericPageErrorState: FC<{
  config: CreatorAnalyticsUntabbedPageConfig;
  tryAgain?: () => void;
}> = ({ config, tryAgain }) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { title, description } = useRAQIV2PredefinedPageControlsBundle(config);
  const { chartContext } = useRAQIV2PredefinedSurfaceControlsBundle(config);
  const { preControlComponent } = useRAQIV2PredefinedPreControlComponentsBundle(
    config.preControlCharts ?? [],
    chartContext,
  );

  return (
    <AnalyticsPageLayout
      title={title}
      description={description}
      heroElement={preControlComponent || undefined}
      addHeroDivider={!config.hideHeroDivider}>
      <GenericAnalyticsLayoutItem layout={RAQIV2SpecialLayoutType.FullWidthLayout}>
        <EmptyStateBorder>
          <EmptyState
            title={translate(
              translationKey('Message.RequestFailure', TranslationNamespace.Analytics),
            )}
            size='large'>
            {tryAgain !== undefined && (
              <Button
                size='medium'
                variant='contained'
                color='primary'
                data-testid='empty-state-cta-button'
                onClick={tryAgain}>
                {translate(
                  translationKey('EmptyState.Action.TryAgain', TranslationNamespace.Analytics),
                )}
              </Button>
            )}
          </EmptyState>
        </EmptyStateBorder>
      </GenericAnalyticsLayoutItem>
    </AnalyticsPageLayout>
  );
};
export default RAQIV2GenericPageErrorState;

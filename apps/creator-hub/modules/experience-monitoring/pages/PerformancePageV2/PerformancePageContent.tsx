import React, { FC, useMemo } from 'react';
import { Grid } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { withTranslation } from '@rbx/intl';
import { CreatorAnalyticsLayout } from '@modules/experience-analytics-shared';
import CCUSummary from '../../components/CCUSummary';
import getPerformancePageConfig from './performancePageConfig';

const PerformancePageContent: FC = () => {
  const { isClientScriptCPUTimeEnabled } = useFeatureFlagsForNamespace(
    ['isClientScriptCPUTimeEnabled'],
    FeatureFlagNamespace.Analytics,
  );

  const performancePageConfig = useMemo(() => {
    return getPerformancePageConfig(isClientScriptCPUTimeEnabled);
  }, [isClientScriptCPUTimeEnabled]);

  return (
    <CreatorAnalyticsLayout
      config={performancePageConfig}
      preControlComponentHack={
        <Grid container>
          <CCUSummary />
        </Grid>
      }
    />
  );
};

export default withTranslation(PerformancePageContent, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.Navigation,
]);

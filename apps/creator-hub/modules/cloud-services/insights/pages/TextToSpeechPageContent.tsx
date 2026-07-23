import React, { FunctionComponent } from 'react';

import { withTranslation } from '@rbx/intl';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import TextToSpeechAnalyticsContainer from '../components/TextToSpeechAnalyticsContainer';

const TextToSpeechPage: FunctionComponent = () => {
  const { showTextToSpeechDashboard } = useFeatureFlagsForNamespace(
    'showTextToSpeechDashboard',
    FeatureFlagNamespace.Analytics,
  );

  return showTextToSpeechDashboard && <TextToSpeechAnalyticsContainer />;
};

export default withTranslation(TextToSpeechPage, [TranslationNamespace.CloudServices]);

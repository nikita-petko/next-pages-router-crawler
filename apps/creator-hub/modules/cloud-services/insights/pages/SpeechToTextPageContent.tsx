import React, { FunctionComponent } from 'react';

import { withTranslation } from '@rbx/intl';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import SpeechToTextAnalyticsContainer from '../components/SpeechToTextAnalyticsContainer';

const SpeechToTextPage: FunctionComponent = () => {
  const { showSpeechToTextDashboard } = useFeatureFlagsForNamespace(
    'showSpeechToTextDashboard',
    FeatureFlagNamespace.Analytics,
  );

  return showSpeechToTextDashboard && <SpeechToTextAnalyticsContainer />;
};

export default withTranslation(SpeechToTextPage, [TranslationNamespace.CloudServices]);

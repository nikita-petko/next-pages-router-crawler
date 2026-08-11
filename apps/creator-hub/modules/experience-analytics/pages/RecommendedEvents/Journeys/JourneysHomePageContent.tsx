import type { FC } from 'react';
import { withTranslation } from '@rbx/intl';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import JourneysFlagGate from './components/JourneysFlagGate';
import journeysHomePageConfig from './config/journeysHomePageConfig';

const JourneysHomePageContent: FC = () => (
  <JourneysFlagGate>
    {() => <CreatorAnalyticsLayout config={journeysHomePageConfig} />}
  </JourneysFlagGate>
);

export default withTranslation(JourneysHomePageContent, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
]);

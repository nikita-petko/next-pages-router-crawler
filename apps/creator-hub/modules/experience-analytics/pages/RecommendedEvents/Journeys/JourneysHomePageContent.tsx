import type { FC } from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import JourneysFlagGate from './components/JourneysFlagGate';
import JourneysHomeBody from './components/JourneysHomeBody';

const JourneysHomePageContent: FC = () => (
  <JourneysFlagGate>{(resource) => <JourneysHomeBody resource={resource} />}</JourneysFlagGate>
);

export default withTranslation(JourneysHomePageContent, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
]);

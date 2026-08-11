import type { FC } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import BreadcrumbItemType from '@modules/navigation/layout/enums/BreadcrumbsItemType';
import useBreadcrumbRegistration from '@modules/navigation/layout/hooks/useBreadcrumbRegistration';
import JourneysFlagGate from '../Journeys/components/JourneysFlagGate';
import JourneyConfigWizard from './components/JourneyConfigWizard';
import { makeEmptyJourney } from './journeyFormValues';

const JourneysCreatePage: FC = () => {
  const { translate } = useTranslationWrapper(useTranslation());

  useBreadcrumbRegistration(
    BreadcrumbItemType.Create,
    translate(translationKey('Action.CreateJourneyConfig', TranslationNamespace.Analytics)) ??
      undefined,
  );

  return (
    <JourneysFlagGate>
      {() => <JourneyConfigWizard initialValues={makeEmptyJourney()} />}
    </JourneysFlagGate>
  );
};

export default JourneysCreatePage;

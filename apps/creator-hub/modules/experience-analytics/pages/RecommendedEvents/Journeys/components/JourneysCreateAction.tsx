import type { FC } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';

const JourneysCreateAction: FC<{ universeId: number }> = ({ universeId }) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  return (
    <Button
      variant='Emphasis'
      size='Medium'
      as='a'
      href={dashboard.getAnalyticsJourneysCreateUrl(universeId)}>
      {tPendingTranslation(
        'Create',
        'Button to create a new journey configuration',
        translationKey('Action.CreateJourneyConfig', TranslationNamespace.Analytics),
      )}
    </Button>
  );
};

export default JourneysCreateAction;

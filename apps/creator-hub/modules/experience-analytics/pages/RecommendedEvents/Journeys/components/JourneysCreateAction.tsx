import type { FC } from 'react';
import { useCallback } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { AnalyticsPageAction } from '@modules/charts-generic/layout/AnalyticsPageAction';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useJourneyConfigs } from '../../JourneysCreate/useJourneyConfigStorage';

const JourneysCreateAction: FC = () => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const router = useRouter();
  const { id } = router.query;
  const { data: configs, isLoading } = useJourneyConfigs();

  const handleClick = useCallback(() => {
    void router.push(`/dashboard/creations/experiences/${String(id)}/analytics/journeys/create`);
  }, [id, router]);

  if (isLoading || (configs ?? []).length === 0) {
    return null;
  }

  return (
    <AnalyticsPageAction
      variant='Emphasis'
      size='Medium'
      text={tPendingTranslation(
        'Create',
        'Button to create a new journey configuration',
        translationKey('Action.CreateJourneyConfig', TranslationNamespace.Analytics),
      )}
      onClick={handleClick}
    />
  );
};

export default JourneysCreateAction;

import { useCallback } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

function JourneysPageTitle() {
  const router = useRouter();
  const { query, isReady } = router;
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const journeyName =
    isReady && typeof query.filter_JourneyName === 'string' ? query.filter_JourneyName : '';

  const onEditClicked = useCallback(() => {
    void router.push(
      `/dashboard/creations/experiences/${String(query.id)}/analytics/journeys/edit?journeyName=${encodeURIComponent(journeyName)}`,
    );
  }, [router, query.id, journeyName]);

  if (!isReady) {
    return null;
  }

  return (
    <div className='flex items-start justify-between width-full'>
      <h1 className='text-heading-large margin-none'>{journeyName}</h1>
      {journeyName !== '' && (
        <Button variant='Standard' size='Medium' onClick={onEditClicked}>
          {tPendingTranslation(
            'Edit config',
            'Button to navigate to the edit config page for this journey',
            translationKey('Action.EditJourneyConfig', TranslationNamespace.Analytics),
          )}
        </Button>
      )}
    </div>
  );
}

export default withTranslation(JourneysPageTitle, [TranslationNamespace.Analytics]);

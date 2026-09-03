import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import {
  translationKey,
  brandUntranslatableText,
} from '@modules/analytics-translations/wrapperFunctions';
import { AnalyticsPageDescription } from '@modules/charts-generic/layout/AnalyticsPageDescription';
import { AnalyticsPageTitle } from '@modules/charts-generic/layout/AnalyticsPageTitle';
import Link from '@modules/miscellaneous/components/CreatorDashboardLink';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard, docs } from '@modules/miscellaneous/urls/creatorHub';
import { useJourneyConfigs } from '../JourneysCreate/useJourneyConfigStorage';
import JourneysCreateAction from './components/JourneysCreateAction';

function useParamsFromRouter(): {
  universeId: number | undefined;
  journeyName: string | undefined;
} {
  const router = useRouter();
  const { query, isReady } = router;
  const { id, filter_JourneyName } = query;

  return useMemo(() => {
    if (!isReady) {
      return { universeId: undefined, journeyName: undefined };
    }
    const rawId = Number(id);

    if (isNaN(rawId)) {
      return { universeId: undefined, journeyName: undefined };
    }
    return {
      universeId: rawId,
      journeyName:
        filter_JourneyName === '' || typeof filter_JourneyName !== 'string'
          ? undefined
          : filter_JourneyName,
    };
  }, [isReady, id, filter_JourneyName]);
}

function TakeActionJourneyEventsDescription() {
  const { translateHTML } = useTranslationWrapper(useTranslation());

  return (
    <AnalyticsPageDescription
      text={translateHTML(
        translationKey('Description.TakeActionJourneyEvents', TranslationNamespace.Analytics),
        [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content: (chunks) => (
              <Link href={docs.getAnalyticsJourneyEventsUrl()} color='inherit' underline='always'>
                {chunks}
              </Link>
            ),
          },
        ],
      )}
    />
  );
}

function JourneysHomePageTitleInner() {
  const { universeId } = useParamsFromRouter();
  const { translate } = useTranslationWrapper(useTranslation());

  const { data: configs, isLoading } = useJourneyConfigs(universeId);

  const isCreateButtonHidden =
    isLoading || (configs ?? []).length === 0 || universeId === undefined;

  return (
    <div className='flex items-center justify-between width-full'>
      <div className='flex flex-col gap-small'>
        <AnalyticsPageTitle
          text={translate(translationKey('Heading.Journeys', TranslationNamespace.Analytics))}
        />
        <TakeActionJourneyEventsDescription />
      </div>
      {!isCreateButtonHidden && <JourneysCreateAction universeId={universeId} />}
    </div>
  );
}

function JourneysViewPageTitleInner() {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { universeId, journeyName } = useParamsFromRouter();

  if (!universeId || !journeyName) {
    return null;
  }

  return (
    <div className='flex items-center justify-between width-full'>
      <div className='flex flex-col gap-small'>
        <AnalyticsPageTitle text={brandUntranslatableText(journeyName)} />
        <TakeActionJourneyEventsDescription />
      </div>
      {journeyName !== '' && (
        <Button
          variant='Standard'
          size='Medium'
          as='a'
          href={dashboard.getAnalyticsJourneysEditUrl(universeId, journeyName)}>
          {tPendingTranslation(
            'Edit',
            'Button to navigate to the edit config page for this journey',
            translationKey('Action.EditJourneyConfig', TranslationNamespace.Analytics),
          )}
        </Button>
      )}
    </div>
  );
}

export const JourneysHomePageTitle = withTranslation(JourneysHomePageTitleInner, [
  TranslationNamespace.Analytics,
]);

export const JourneysViewPageTitle = withTranslation(JourneysViewPageTitleInner, [
  TranslationNamespace.Analytics,
]);

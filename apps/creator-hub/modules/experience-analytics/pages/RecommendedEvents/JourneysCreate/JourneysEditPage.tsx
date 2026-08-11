import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { RAQIV2ChartResource } from '@modules/clients/analytics';
import { PageLoading } from '@modules/miscellaneous/components';
import BreadcrumbItemType from '@modules/navigation/layout/enums/BreadcrumbsItemType';
import useBreadcrumbRegistration from '@modules/navigation/layout/hooks/useBreadcrumbRegistration';
import JourneysFlagGate from '../Journeys/components/JourneysFlagGate';
import JourneyConfigWizard from './components/JourneyConfigWizard';
import { entryToFormValues } from './journeyFormValues';
import type { JourneyEntry } from './useJourneyConfigStorage';
import { useCurrentJourneyConfig } from './useJourneyConfigStorage';

const JourneysEditPageContent: FC<{ resource: RAQIV2ChartResource; journeyName: string }> = ({
  resource,
  journeyName,
}) => {
  const router = useRouter();
  const {
    data: entry,
    isLoading,
    isFetched,
    isError,
  } = useCurrentJourneyConfig(resource.id, journeyName);

  // Keep the last found entry: a rename's background refetch invalidation
  // removes the old key, which would otherwise trip the not-found check
  // below and redirect to /404 right after a successful save.
  const [lastFoundEntry, setLastFoundEntry] = useState<JourneyEntry | undefined>(undefined);
  if (entry && entry !== lastFoundEntry) {
    setLastFoundEntry(entry);
  }
  const resolvedEntry: JourneyEntry | undefined = entry ?? lastFoundEntry;

  useBreadcrumbRegistration(BreadcrumbItemType.AnalyticsJourneys, resolvedEntry?.journeyName);

  const initialValues = useMemo(
    () => (resolvedEntry ? entryToFormValues(resolvedEntry) : undefined),
    [resolvedEntry],
  );

  if (resolvedEntry && initialValues) {
    return (
      <JourneyConfigWizard initialValues={initialValues} originalName={resolvedEntry.journeyName} />
    );
  }

  if (isError || (!isLoading && isFetched && !resolvedEntry)) {
    void router.replace('/404');
    return null;
  }

  return <PageLoading />;
};

/**
 * Top-level component for the journeys edit route: resolves the journey by
 * name from the URL query, self-gates on the feature flag, and redirects to
 * `/404` when it can't be found.
 */
const JourneysEditPage: FC = () => {
  const router = useRouter();

  const rawJourneyNameParam = router.query.journeyName;
  const journeyName: string | undefined =
    router.isReady && typeof rawJourneyNameParam === 'string' && rawJourneyNameParam.length > 0
      ? rawJourneyNameParam
      : undefined;

  if (!router.isReady) {
    return <PageLoading />;
  }

  if (!journeyName) {
    void router.replace('/404');
    return null;
  }

  return (
    <JourneysFlagGate>
      {(resource) => <JourneysEditPageContent resource={resource} journeyName={journeyName} />}
    </JourneysFlagGate>
  );
};

export default JourneysEditPage;

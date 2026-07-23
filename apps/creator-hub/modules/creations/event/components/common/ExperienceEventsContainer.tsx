import { useEffect, useMemo } from 'react';
import type { SearchCreatorType } from '@rbx/client-universes-api/v1';
import type { PagingParameters, SortOrder } from '@rbx/core';
import { StatusCodes } from '@rbx/core';
import { buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Link, Tab, Tabs, Typography } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';
import type { Asset } from '@modules/miscellaneous/common';
import { PageLoading } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import type { TSettings } from '@modules/settings/SettingsProvider/settingsHelpers';
import type { AssetSorts } from '../../../common/interfaces/CreationsFilters';
import EventAnalyticsTabContent from '../EventAnalytics/EventAnalyticsTabContent';
import EventsListContainer from '../EventsListContainer/EventsListContainer';
import { experienceEventsLearnMoreLink } from './constants';

const enum EventPageView {
  Creations = 'creations',
  Analytics = 'analytics',
}

export interface ExperienceEventsPagingParameters extends PagingParameters {
  assetType: Asset;
  creatorType: SearchCreatorType;
  creatorTargetId: number;
  isActive?: boolean;
  isArchived?: boolean;
  sort: AssetSorts;
  sortOrder: SortOrder;
  isClickable: boolean;
  fromUtc?: Date;
  settings?: TSettings;
}

const ExperienceEventsContainer = () => {
  const { translate, translateHTML } = useTranslation();
  const [query, setQuery] = useQueryParams(['activeTab']);
  const { gameDetails } = useCurrentGame();
  const { user } = useAuthentication();
  const { permissions: orgPermissions } = useCurrentOrganization();
  const canConfigureEvents = useMemo(() => {
    const isOwnedByUser =
      gameDetails?.creator?.type === 'User' && gameDetails?.creator?.id === user?.id;
    return isOwnedByUser || orgPermissions?.canManageExperienceEvents;
  }, [orgPermissions, gameDetails, user]);
  const { userCanViewAnalyticsForUniverse, isPending: isPendingAnalyticsExperiencePermissions } =
    useAnalyticsExperiencePermissions(gameDetails?.id ?? uninitializedUniverseId);

  const tabs = useMemo(() => {
    if (!userCanViewAnalyticsForUniverse) {
      // No tabs, only configure
      return <EventsListContainer />;
    }
    if (userCanViewAnalyticsForUniverse && !canConfigureEvents) {
      // No tabs, only analytics
      return <EventAnalyticsTabContent />;
    }
    // Both tabs
    return (
      <>
        <Tabs
          onChange={(_, value) => {
            setQuery({ activeTab: String(value) });
          }}
          value={query.activeTab ?? EventPageView.Creations}>
          <Tab label={translate('Heading.Creations')} value={EventPageView.Creations} />
          <Tab label={translate('Action.Analytics')} value={EventPageView.Analytics} />
        </Tabs>
        {query.activeTab === EventPageView.Creations || !query.activeTab ? (
          <>
            <HubMeta hubOnly title={buildTitle(translate('Heading.Creations'))} />
            <EventsListContainer />
          </>
        ) : (
          <>
            <HubMeta hubOnly title={buildTitle(translate('Action.Analytics'))} />
            <EventAnalyticsTabContent />
          </>
        )}
      </>
    );
  }, [canConfigureEvents, query.activeTab, setQuery, translate, userCanViewAnalyticsForUniverse]);

  useEffect(() => {
    // If the query string is invalid, set it back to Creations
    if (
      query.activeTab?.toString() !== EventPageView.Analytics &&
      query.activeTab?.toString() !== EventPageView.Creations
    ) {
      setQuery({ activeTab: EventPageView.Creations });
    }
  }, [query, setQuery]);

  if (isPendingAnalyticsExperiencePermissions) {
    return <PageLoading />;
  }

  if (!canConfigureEvents && !userCanViewAnalyticsForUniverse) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  return (
    <Grid margin='12px'>
      <Grid container direction='column' gap='8px' marginBottom='40px'>
        <Typography color='secondary' variant='body1'>
          {translateHTML('Message.EEEventsAndUpdatesLearnMore', [
            {
              opening: 'docsLinkStart',
              closing: 'docsLinkEnd',
              content(chunks) {
                return (
                  <Link href={experienceEventsLearnMoreLink} target='_blank'>
                    {chunks}
                  </Link>
                );
              },
            },
          ])}
        </Typography>
      </Grid>
      {tabs}
    </Grid>
  );
};

export default withTranslation(ExperienceEventsContainer, [TranslationNamespace.Creations]);

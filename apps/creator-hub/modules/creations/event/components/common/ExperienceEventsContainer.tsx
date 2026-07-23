import { Asset, PageLoading } from '@modules/miscellaneous/common';
import { Fragment, useEffect, useMemo } from 'react';
import { SearchCreatorType } from '@rbx/clients/universesApi';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Link, Tab, Tabs, Typography } from '@rbx/ui';
import { PagingParameters, SortOrder, StatusCodes } from '@rbx/core';
import { TSettings } from '@modules/settings';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { ErrorPage } from '@modules/miscellaneous/error';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import { useAuthentication } from '@modules/authentication/providers';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { AssetSorts } from '../../../common';
import EventsListContainer from '../EventsListContainer/EventsListContainer';
import { experienceEventsLearnMoreLink } from './constants';
import EventAnalyticsTabContent from '../EventAnalytics/EventAnalyticsTabContent';

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
  const { userCanViewAnalyticsForUniverse, isFetched: isAnalyticsFlagsFetched } =
    useFeatureFlagsForNamespace('userCanViewAnalyticsForUniverse', FeatureFlagNamespace.Analytics);

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
      <Fragment>
        <Tabs
          onChange={(_, value) => {
            setQuery({ activeTab: value });
          }}
          value={query.activeTab ?? EventPageView.Creations}>
          <Tab label={translate('Heading.Creations')} value={EventPageView.Creations} />
          <Tab label={translate('Action.Analytics')} value={EventPageView.Analytics} />
        </Tabs>
        {query.activeTab === EventPageView.Creations || !query.activeTab ? (
          <Fragment>
            <HubMeta hubOnly title={buildTitle(translate('Heading.Creations'))} />
            <EventsListContainer />
          </Fragment>
        ) : (
          <Fragment>
            <HubMeta hubOnly title={buildTitle(translate('Action.Analytics'))} />
            <EventAnalyticsTabContent />
          </Fragment>
        )}
      </Fragment>
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

  if (!isAnalyticsFlagsFetched) return <PageLoading />;

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

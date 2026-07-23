import React, { FunctionComponent, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { AddIcon, Button, Grid, LaunchIcon } from '@rbx/ui';
import { PagingParameters, SortOrder } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import useStudio, { EStudioTaskType } from '@modules/miscellaneous/hooks/useStudio';
import { Asset, assetTypeToItemType, Item, PageLoading } from '@modules/miscellaneous/common';
import { TSettings, useSettings } from '@modules/settings';

import { SearchCreatorType } from '@rbx/clients/universesApi';
import { useRouter } from 'next/router';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import {
  AssetSorts,
  CreationsGridEmptyState,
  CreationData,
  useCreationsFilters,
  ItemCardContainer,
  ItemGridContainer,
} from '../../common';
import loadActiveUsersForGames, {
  IdToActiveUsers,
} from '../../collaborativeTools/utils/loadActiveUsers';
import OpenStudioButton from '../../developerItem/common/list/openStudioButton/OpenStudioButton';
import { maybeAppendGroupIdToUrl } from '../../event/utils/eventUtils';
import sendEventsAnalyticsEvent from '../../event/utils/eventsAnalyticsHelper';
import { creationsMenuManager } from '../../menu';
import loadCreationsForAssetType from '../utils/loadCreationsUtils';
import AgeRestrictedCollaborationInfo from '../components/AgeRestrictedCollaborationInfo';
import AgeRestrictedExperiencesList from '../components/AgeRestrictedExperiencesList';
import useCreationsGridContainerStyles from './CreationsGridContainer.styles';

export interface CreationsGridPagingParameters extends PagingParameters {
  assetType: Asset;
  creatorType: SearchCreatorType;
  creatorTargetId: number;
  isActive?: boolean;
  isArchived?: boolean;
  isAgeRestrictedCollaboration?: boolean;
  sort: AssetSorts;
  sortOrder: SortOrder;
  isClickable: boolean;
  fromUtc?: Date;
  settings?: TSettings;
  universeId?: number;
  enableExperienceReleases?: boolean;
  enableImpactedExperiencesView?: boolean;
  enableAccessAnnotationUpdate?: boolean;
}

export interface CreationsGridContainerProps {
  assetType: Asset;
  creatorType: SearchCreatorType;
  creatorTargetId: number;
}

const CreationsGridContainer: FunctionComponent<
  React.PropsWithChildren<CreationsGridContainerProps>
> = ({ assetType, creatorType, creatorTargetId }) => {
  const {
    classes: { gridContainer, createButtonContainer },
  } = useCreationsGridContainerStyles();
  const { sort, sortOrder, isArchived, isAgeRestrictedCollaboration, isPublicOnly } =
    useCreationsFilters();
  const { translate } = useTranslation();
  const [hasData, setHasData] = useState<boolean>(false);
  const { settings } = useSettings();
  const [fromUtc] = useState(() => new Date());
  const presenceRef = useRef<IdToActiveUsers>({} as IdToActiveUsers);
  const { trackerClient } = useEventTrackerProvider();
  const {
    params: { enableExperienceReleases, enableImpactedExperiencesView },
    isFetched: isIxpFetched,
  } = useIXPParameters(IXPLayers.CreatorDashboard);

  const { isCompatible, open, dialog } = useStudio();

  const pagingParameters = useMemo(() => {
    return {
      assetType,
      creatorType,
      creatorTargetId,
      isArchived,
      isAgeRestrictedCollaboration,
      isActive: isPublicOnly ? true : undefined,
      sort,
      sortOrder,
      isClickable: false,
      fromUtc,
      settings,
      enableExperienceReleases: enableExperienceReleases ?? false,
      enableImpactedExperiencesView: enableImpactedExperiencesView ?? false,
      enableAccessAnnotationUpdate: true,
    };
  }, [
    settings,
    assetType,
    creatorType,
    creatorTargetId,
    isArchived,
    isAgeRestrictedCollaboration,
    isPublicOnly,
    sort,
    sortOrder,
    fromUtc,
    enableExperienceReleases,
    enableImpactedExperiencesView,
  ]);

  const loadItems = useCallback(
    async (params: CreationsGridPagingParameters) => loadCreationsForAssetType(params),
    [],
  );

  const itemType = assetTypeToItemType[pagingParameters.assetType];

  const handleCreateExperienceButtonClick = useCallback(() => {
    open({ task: EStudioTaskType.Default });
  }, [open]);

  const router = useRouter();
  const currentGroup = useCurrentGroup();
  const handleCreateEventButtonClick = useCallback(() => {
    const creationPath = maybeAppendGroupIdToUrl(
      '/dashboard/creations/events/create',
      currentGroup,
    );
    router.push(creationPath);
  }, [router, currentGroup]);

  const shouldShowCreateEventButton = useMemo(
    () => assetTypeToItemType[assetType] === Item.Event,
    [assetType],
  );

  const createEventButton = useMemo(
    () => (
      <Button
        data-testid='create-event-button'
        variant='contained'
        size='large'
        color={hasData ? 'primaryBrand' : 'primary'}
        aria-label={translate('Button.CreateNewItem', {
          itemType: translate('Label.Event'),
        })}
        onClick={handleCreateEventButtonClick}>
        <AddIcon />
        <span>
          &nbsp;
          {translate('Button.CreateNewItem', {
            itemType: translate('Label.Event'),
          })}
        </span>
      </Button>
    ),
    [handleCreateEventButtonClick, translate, hasData],
  );

  const createExperienceButton = useMemo(() => {
    if (
      isCompatible &&
      (pagingParameters.assetType === Asset.MyExperiences ||
        pagingParameters.assetType === Asset.SharedExperiences)
    ) {
      return (
        <Button
          data-testid='create-experiences-button'
          variant='contained'
          size='large'
          endIcon={<LaunchIcon />}
          onClick={handleCreateExperienceButtonClick}>
          <span>
            {translate('Button.CreateNewItem', {
              itemType: translate(creationsMenuManager.getAssetFullNameKey(assetType)),
            })}
          </span>
        </Button>
      );
    }

    return undefined;
  }, [isCompatible, pagingParameters, handleCreateExperienceButtonClick, assetType, translate]);

  const createButton = shouldShowCreateEventButton ? createEventButton : createExperienceButton;

  useEffect(() => {
    if (shouldShowCreateEventButton) {
      sendEventsAnalyticsEvent(trackerClient, {
        eventType: CreatorDashboardEventType.EventCreationExposure,
      });
    }
  }, [shouldShowCreateEventButton, trackerClient]);

  useEffect(() => {
    if (shouldShowCreateEventButton) {
      sendEventsAnalyticsEvent(trackerClient, {
        eventType: CreatorDashboardEventType.EventCreationExposure,
      });
    }
  }, [shouldShowCreateEventButton, trackerClient]);

  const errorContent = useMemo(() => {
    const getErrorButton = () => {
      if (shouldShowCreateEventButton) {
        return createEventButton;
      }
      return <OpenStudioButton />;
    };

    return (
      <CreationsGridEmptyState assetType={assetType}>{getErrorButton()}</CreationsGridEmptyState>
    );
  }, [createEventButton, shouldShowCreateEventButton, assetType]);

  const onLoad = useCallback(
    (data: CreationData[]) => {
      setHasData(data.length > 0);
    },
    [setHasData],
  );

  const loadItemCallbackForAsset = useCallback(
    async (data: CreationData[]) => {
      if (assetType === Asset.MyExperiences || assetType === Asset.SharedExperiences) {
        const curPagePresence = await loadActiveUsersForGames(data, presenceRef.current);
        presenceRef.current =
          presenceRef.current === undefined
            ? curPagePresence
            : Object.assign(presenceRef.current, curPagePresence);
      }
    },
    [assetType, presenceRef],
  );

  const updateItemsForAsset = useCallback(
    (data: CreationData[]) => {
      if (assetType === Asset.MyExperiences || assetType === Asset.SharedExperiences) {
        return data.map((game) => {
          if (
            game.universeId &&
            presenceRef.current &&
            Object.prototype.hasOwnProperty.call(presenceRef.current, game.universeId)
          ) {
            return { ...game, activeUsers: presenceRef.current[game.universeId] };
          }
          return game;
        });
      }
      return data;
    },
    [assetType, presenceRef],
  );

  if (!isIxpFetched) {
    return <PageLoading />;
  }

  return (
    <React.Fragment>
      {enableImpactedExperiencesView && (
        <Grid container item className={gridContainer} wrap='nowrap' direction='column'>
          <AgeRestrictedCollaborationInfo />
        </Grid>
      )}
      <Grid container item className={gridContainer} wrap='nowrap' direction='column'>
        {hasData && createButton && (
          <Grid item className={createButtonContainer}>
            {createButton}
          </Grid>
        )}
        {enableImpactedExperiencesView && isAgeRestrictedCollaboration ? (
          <AgeRestrictedExperiencesList
            pagingParameters={pagingParameters}
            emptyMessage={errorContent}
          />
        ) : (
          <ItemGridContainer
            pagingParameters={pagingParameters}
            loadItems={loadItems}
            onNewPageLoaded={loadItemCallbackForAsset}
            updateItems={updateItemsForAsset}
            getItemKey={(item) => item.assetId ?? 0}
            GridItemComponent={ItemCardContainer}
            errorMessage={translate('Message.LoadItemsError', {
              itemType: translate(creationsMenuManager.getAssetFullNameKey(assetType)),
            })}
            emptyMessage={errorContent}
            onLoad={onLoad}
            useWideIcons={itemType === Item.Event}
          />
        )}
      </Grid>
      {dialog}
    </React.Fragment>
  );
};

export default CreationsGridContainer;

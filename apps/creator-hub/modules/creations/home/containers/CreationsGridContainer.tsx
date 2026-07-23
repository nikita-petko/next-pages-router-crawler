import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import type { SearchCreatorType } from '@rbx/client-universes-api/v1';
import { useTranslation } from '@rbx/intl';
import { AddIcon, Button, Grid, LaunchIcon } from '@rbx/ui';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { Asset, assetTypeToItemType, Item } from '@modules/miscellaneous/common';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import useStudio, { EStudioTaskType } from '@modules/miscellaneous/hooks/useStudio';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import type { IdToActiveUsers } from '../../collaborativeTools/utils/loadActiveUsers';
import loadActiveUsersForGames from '../../collaborativeTools/utils/loadActiveUsers';
import CreationsGridEmptyState from '../../common/components/CreationsGridEmptyState/CreationsGridEmptyState';
import ItemCardContainer from '../../common/containers/ItemCardContainer';
import ItemGridContainer from '../../common/containers/ItemGridContainer';
import useCreationsFilters from '../../common/hooks/useCreationsFilters';
import type CreationData from '../../common/interfaces/CreationData';
import OpenStudioButton from '../../developerItem/common/list/openStudioButton/OpenStudioButton';
import sendEventsAnalyticsEvent from '../../event/utils/eventsAnalyticsHelper';
import { maybeAppendGroupIdToUrl } from '../../event/utils/eventUtils';
import creationsMenuManager from '../../menu/implementations/CreationsMenuManager';
import AgeRestrictedCollaborationInfo from '../components/AgeRestrictedCollaborationInfo';
import AgeRestrictedExperiencesList from '../components/AgeRestrictedExperiencesList';
import useHasImpactedExperienceInView from '../hooks/useHasImpactedExperienceInView';
import type { CreationsGridPagingParameters } from '../types/CreationsGridPagingParameters';
import loadCreationsForAssetType from '../utils/loadCreationsUtils';
import type { ScoutPagingParameters } from '../utils/loadImpactScoutPage';
import useCreationsGridContainerStyles from './CreationsGridContainer.styles';

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
    params: { enableAudiencesReplacement },
  } = useIXPParameters(IXPLayers.CreatorHubCreationsPermission);

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
      isOwnerViewEnabled: true,
      enableAccessAnnotationUpdate: true,
      enableAudiencesReplacement: enableAudiencesReplacement ?? false,
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
    enableAudiencesReplacement,
  ]);

  const scoutPagingParameters = useMemo<ScoutPagingParameters>(
    () => ({
      assetType,
      creatorType,
      creatorTargetId,
      isPublicOnly,
      isArchived,
      isAgeRestrictedCollaboration,
      sort,
      sortOrder,
    }),
    [
      assetType,
      creatorType,
      creatorTargetId,
      isPublicOnly,
      isArchived,
      isAgeRestrictedCollaboration,
      sort,
      sortOrder,
    ],
  );

  const scoutEnabled = assetType === Asset.MyExperiences || assetType === Asset.SharedExperiences;

  const { status: impactStatus } = useHasImpactedExperienceInView(
    scoutPagingParameters,
    scoutEnabled,
  );

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
    void router.push(creationPath);
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

    return null;
  }, [isCompatible, pagingParameters, handleCreateExperienceButtonClick, assetType, translate]);

  useEffect(() => {
    if (shouldShowCreateEventButton) {
      sendEventsAnalyticsEvent(trackerClient, {
        eventType: CreatorDashboardEventType.EventCreationExposure,
      });
    }
  }, [shouldShowCreateEventButton, trackerClient]);

  const createButton = shouldShowCreateEventButton ? createEventButton : createExperienceButton;

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
            Object.hasOwn(presenceRef.current, game.universeId)
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

  return (
    <>
      {impactStatus === 'found' && (
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
        {isAgeRestrictedCollaboration ? (
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
    </>
  );
};

export default CreationsGridContainer;

import { useCallback, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { PlayWithRewardServingStatus } from '@rbx/client-developer-ads-stats-api/v1';
import { Button as FoundationButton } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import {
  Button,
  Table,
  TableHead,
  TableBody,
  TableContainer,
  Typography,
  TableRow,
  TableCell,
  LockIcon,
  EditOutlinedIcon,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  MoreVertIcon,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import developerAdsStatsClient from '@modules/clients/developerAdsStats';
import { useSnackbarAlert } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ExperienceDetailsPageDocsLink from '../components/ExperienceDetailsPageDocsLink';
import PlacementModal from '../components/PlacementModal';
import {
  DisablePlayWithRewardPlacementDialog,
  EnablePlayWithRewardTestModeDialog,
  LaunchPlayWithRewardPlacementDialog,
} from '../components/PlayWithRewardConfirmationDialog';
import PlayWithRewardStatusLabel from '../components/PlayWithRewardStatusLabel';
import RewardTable, { type RewardTableRow } from '../components/RewardTable';
import useModal from '../hooks/useModal';
import type { Placement } from '../types/placementTypes';
import useImmersiveAdsPageStyles from './ImmersiveAdsPage.styles';

interface ImmersiveAdsPlacementTabContentProps {
  universeId: number;
  placements: Placement[];
  isLoading: boolean;
  error: Error | null;
  onRefreshPlacements: () => void;
  createPlacementUrl: string;
  showPlayWithRewardSettings?: boolean;
  rewardMetadata?: {
    displayDetails?: {
      productName?: string;
      imageAssetId?: number;
    };
  };
  playWithRewardServingStatus: PlayWithRewardServingStatus;
  onRefreshPlayWithRewardServingStatus: () => void;
}

const MAX_PLACEMENTS = 10;

const EMPTY_CELL_PLACEHOLDER = '—';
const EMPTY_CELL = <span className='text-body-medium'>{EMPTY_CELL_PLACEHOLDER}</span>;

const formatLastUpdate = (timestampMs: number): string => {
  if (!timestampMs) {
    return EMPTY_CELL_PLACEHOLDER;
  }
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestampMs));
};

const isPlayWithRewardPlacementVisible = (status: PlayWithRewardServingStatus) => {
  return !(
    status === PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_NONE ||
    status === PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_UNSPECIFIED
  );
};

const isPlayWithRewardPlacementDeactivated = (status: PlayWithRewardServingStatus) => {
  return status === PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_INACTIVE_DISABLED;
};

type RewardRowMenuItem = {
  key: string;
  label: string;
  isDisabled?: boolean;
  onSelect: () => void;
};

const RewardTableRowMenu = ({
  ariaLabel,
  className,
  items,
}: {
  ariaLabel: string;
  className?: string;
  items: RewardRowMenuItem[];
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const closeMenu = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        size='small'
        aria-label={ariaLabel}
        className={className}
        onClick={(event) => setAnchorEl(event.currentTarget)}>
        <MoreVertIcon color='secondary' />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        {items.map((item) => (
          <MenuItem
            key={item.key}
            disabled={item.isDisabled}
            onClick={() => {
              closeMenu();
              item.onSelect();
            }}>
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

const ImmersiveAdsPlacementTabContent: React.FC<ImmersiveAdsPlacementTabContentProps> = ({
  universeId,
  placements,
  isLoading,
  error,
  onRefreshPlacements,
  createPlacementUrl,
  showPlayWithRewardSettings = false,
  rewardMetadata,
  playWithRewardServingStatus,
  onRefreshPlayWithRewardServingStatus,
}) => {
  const {
    classes: {
      placementTabContainer,
      placementNameTableCell,
      placementNameContainer,
      placementIdContainer,
      editIconButton,
      tableRow,
      placementIdTableCell,
      lockIcon,
      loadingContainer,
      errorContainer,
      placementTableContainer,
      placementTableTextContainer,
      placementTableHeaderContainer,
      placementTableTitleTextContainer,
      descriptionStyle,
      createPlacementButtonRowContainer,
    },
    cx,
  } = useImmersiveAdsPageStyles();
  const translation = useTranslation();
  const { translate } = translation;
  const { translate: translateKey, translateHTML } = useTranslationWrapper(translation);
  const showSnackbarMessage = useSnackbarAlert();
  const router = useRouter();
  const [isDisablePlacementModalOpen, setIsDisablePlacementModalOpen] = useState(false);
  const [isEnableTestModeModalOpen, setIsEnableTestModeModalOpen] = useState(false);
  const [isLaunchPlacementModalOpen, setIsLaunchPlacementModalOpen] = useState(false);
  const [isUpdatingPlayWithRewardEnabled, setIsUpdatingPlayWithRewardEnabled] = useState(false);

  const { isModalOpen, openModal, closeModal, modalContent } = useModal();

  const handlePlacementUpdate = useCallback(
    async (placementIdValue: number, newName: string) => {
      try {
        const response = await developerAdsStatsClient.updatePlacement({
          adPlacementId: placementIdValue,
          updatePlacementRequest: {
            name: newName.trim(),
          },
        });
        if (response.isUpdated) {
          onRefreshPlacements();
          showSnackbarMessage('success', 'Placement updated successfully!');
        } else {
          showSnackbarMessage('error', translate('Label.PlacementUpdateError'));
        }
      } catch {
        showSnackbarMessage('error', translate('Label.PlacementUpdateError'));
      }
      closeModal();
    },
    [closeModal, onRefreshPlacements, showSnackbarMessage, translate],
  );

  const handlePlacementCreate = useCallback(
    async (name: string) => {
      try {
        await developerAdsStatsClient.createPlacement({
          createPlacementRequest: {
            name: name.trim(),
            universeId,
          },
        });
        onRefreshPlacements();
        showSnackbarMessage('success', translate('Label.PlacementCreatedSuccess'));
      } catch {
        showSnackbarMessage('error', translate('Label.PlacementCreateError'));
      }
      closeModal();
    },
    [closeModal, universeId, onRefreshPlacements, showSnackbarMessage, translate],
  );

  const handleCreateClick = useCallback(() => {
    openModal(
      <PlacementModal
        isOpen
        onClose={closeModal}
        onSubmit={handlePlacementCreate}
        title={translate('Title.CreatePlacement')}
        description={translate('Description.CreatePlacement')}
      />,
    );
  }, [openModal, closeModal, handlePlacementCreate, translate]);

  const handleEditClick = useCallback(
    (placementId: number, currentName: string) => {
      openModal(
        <PlacementModal
          isOpen
          onClose={closeModal}
          onSubmit={(newName: string) => handlePlacementUpdate(placementId, newName)}
          title={translate('Title.EditPlacement')}
          description={translate('Description.EditPlacement')}
          initialValue={currentName}
          isEdit
        />,
      );
    },
    [openModal, closeModal, handlePlacementUpdate, translate],
  );

  const handlePlayWithRewardEdit = useCallback(() => {
    void router.push(createPlacementUrl);
  }, [createPlacementUrl, router]);

  const handleEnableTestMode = useCallback(() => {
    setIsEnableTestModeModalOpen(true);
  }, []);

  const handleLaunchPlacement = useCallback(() => {
    setIsLaunchPlacementModalOpen(true);
  }, []);

  const handleCloseLaunchPlacementModal = useCallback(() => {
    setIsLaunchPlacementModalOpen(false);
  }, []);

  const handleConfirmLaunchPlacement = useCallback(() => {
    // TODO: Call DASA endpoint to activate once available.
    handleCloseLaunchPlacementModal();
  }, [handleCloseLaunchPlacementModal]);

  const handleCloseEnableTestModeModal = useCallback(() => {
    setIsEnableTestModeModalOpen(false);
  }, []);

  const handleConfirmEnableTestMode = useCallback(() => {
    // TODO: Call DASA endpoint to test mode once available
    handleCloseEnableTestModeModal();
  }, [handleCloseEnableTestModeModal]);

  const handleCloseDisablePlacementModal = useCallback(() => {
    setIsDisablePlacementModalOpen(false);
  }, []);

  const handleOpenDisablePlacementModal = useCallback(() => {
    setIsDisablePlacementModalOpen(true);
  }, []);

  const handleDisablePlacement = useCallback(async () => {
    setIsUpdatingPlayWithRewardEnabled(true);
    try {
      await developerAdsStatsClient.updateUniverseAdsSettings({
        universeId,
        updateUniverseAdsSettingsRequest: {
          isPlayWithRewardEnabled: false,
        },
      });
      handleCloseDisablePlacementModal();
      onRefreshPlayWithRewardServingStatus();
      showSnackbarMessage('success', translate('Description.PlacementDeactivated'));
    } catch {
      showSnackbarMessage('error', translate('Label.PlacementUpdateError'));
    } finally {
      setIsUpdatingPlayWithRewardEnabled(false);
    }
  }, [
    handleCloseDisablePlacementModal,
    onRefreshPlayWithRewardServingStatus,
    showSnackbarMessage,
    translate,
    universeId,
  ]);

  const handleEnablePlacement = useCallback(async () => {
    setIsUpdatingPlayWithRewardEnabled(true);
    try {
      await developerAdsStatsClient.updateUniverseAdsSettings({
        universeId,
        updateUniverseAdsSettingsRequest: {
          isPlayWithRewardEnabled: true,
        },
      });
      onRefreshPlayWithRewardServingStatus();
      showSnackbarMessage('success', translate('Label.PlacementCreatedSuccess'));
    } catch {
      showSnackbarMessage('error', translate('Label.PlacementUpdateError'));
    } finally {
      setIsUpdatingPlayWithRewardEnabled(false);
    }
  }, [onRefreshPlayWithRewardServingStatus, showSnackbarMessage, translate, universeId]);

  if (isLoading) {
    return (
      <div className={`${placementTabContainer} ${loadingContainer}`}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${placementTabContainer} ${errorContainer}`}>
        <Alert severity='error'>
          {/* oxlint-disable-next-line rbx/no-hardcoded-translation-string -- pre-existing */}
          <Typography>Error loading placements: {error.message}</Typography>
        </Alert>
      </div>
    );
  }

  const isMaxPlacementsReached = placements?.length >= MAX_PLACEMENTS;
  const isDisabled = isMaxPlacementsReached || placements?.length === 0;

  const getInExperienceTooltipTitle = () => {
    if (placements?.length === 0) {
      return translate('Tooltip.NoDefaultPlacement');
    }
    if (isMaxPlacementsReached) {
      return translate('Tooltip.MaxPlacementReached');
    }
    return '';
  };

  const isPlayWithRewardPlacementActive =
    playWithRewardServingStatus ===
    PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_ACTIVE;
  const isPlayWithRewardPlacementInTestMode =
    playWithRewardServingStatus ===
    PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_INACTIVE_PENDING;
  const rewardItemAltText = translateKey(
    translationKey('Heading.RewardItem', TranslationNamespace.ImmersiveAdsAnalytics),
  );
  const enableTestModeMenuItem: RewardRowMenuItem = {
    key: 'enable-test-mode',
    label: translateKey(
      translationKey('Action.EnableTestMode', TranslationNamespace.ImmersiveAdsAnalytics),
    ),
    onSelect: handleEnableTestMode,
  };
  const editPlacementMenuItem: RewardRowMenuItem = {
    key: 'edit-placement',
    label: translateKey(
      translationKey('Action.EditPlacement', TranslationNamespace.ImmersiveAdsAnalytics),
    ),
    onSelect: handlePlayWithRewardEdit,
  };
  const disablePlacementMenuItem: RewardRowMenuItem = {
    key: 'disable-placement',
    label: translateKey(
      translationKey('Action.DisablePlacement', TranslationNamespace.ImmersiveAdsAnalytics),
    ),
    onSelect: handleOpenDisablePlacementModal,
  };
  const enablePlacementMenuItem: RewardRowMenuItem = {
    key: 'enable-placement',
    label: translateKey(
      translationKey('Action.EnablePlacement', TranslationNamespace.ImmersiveAdsAnalytics),
    ),
    onSelect: handleEnablePlacement,
  };
  const playWithRewardMenuItems: RewardRowMenuItem[] = isPlayWithRewardPlacementActive
    ? [disablePlacementMenuItem, enableTestModeMenuItem, editPlacementMenuItem]
    : isPlayWithRewardPlacementDeactivated(playWithRewardServingStatus)
      ? [enablePlacementMenuItem, enableTestModeMenuItem, editPlacementMenuItem]
      : [disablePlacementMenuItem, editPlacementMenuItem];

  const playWithRewardRows: RewardTableRow[] = [
    {
      key: 'play-with-reward',
      name: (
        <div className={placementNameContainer}>
          <span className='text-body-medium'>{translate('Label.OnExperienceJoin')}</span>
          <LockIcon color='disabled' className={lockIcon} />
        </div>
      ),
      // TODO: no placement ID for the play-with-reward row yet
      placementId: EMPTY_CELL,
      status: (
        <PlayWithRewardStatusLabel playWithRewardServingStatus={playWithRewardServingStatus} />
      ),
      location: translateKey(
        translationKey('Title.ExperienceDetailsPage', TranslationNamespace.ImmersiveAdsAnalytics),
      ),
      rewardItem: (
        <div className='gap-small flex items-center'>
          {rewardMetadata?.displayDetails && rewardMetadata.displayDetails.imageAssetId && (
            <Avatar variant='rounded' alt={rewardItemAltText} className='size-800'>
              <Thumbnail2d
                type={ThumbnailTypes.assetThumbnail}
                targetId={rewardMetadata.displayDetails.imageAssetId}
                alt={rewardItemAltText}
              />
            </Avatar>
          )}
          <span className='text-body-medium'>{rewardMetadata?.displayDetails?.productName}</span>
        </div>
      ),
      // TODO: last update timestamp not available for the reward row
      lastUpdate: EMPTY_CELL,
      actions: (
        <div className='flex width-full items-center justify-end gap-xsmall'>
          {isPlayWithRewardPlacementInTestMode && (
            <FoundationButton variant='SoftEmphasis' size='Medium' onClick={handleLaunchPlacement}>
              {translateKey(
                translationKey('Action.Launch', TranslationNamespace.ImmersiveAdsAnalytics),
              )}
            </FoundationButton>
          )}
          <RewardTableRowMenu
            ariaLabel={translateKey(
              translationKey('Label.PlacementActions', TranslationNamespace.ImmersiveAdsAnalytics),
            )}
            className='invisible group-hover:visible'
            items={playWithRewardMenuItems}
          />
        </div>
      ),
    },
  ];

  const hasPlayWithRewardPlacementRow =
    Boolean(rewardMetadata) && isPlayWithRewardPlacementVisible(playWithRewardServingStatus);
  const playWithRewardTable = <RewardTable rows={playWithRewardRows} />;

  const inExperienceRows: RewardTableRow[] = placements.map((placement) => ({
    key: placement.id,
    name: (
      <div className={placementNameContainer}>
        {placement.name}
        {placement.defaultPlacement && (
          <Tooltip placement='right' title={translate('Tooltip.DefaultPlacement')}>
            <LockIcon color='disabled' className={lockIcon} />
          </Tooltip>
        )}
      </div>
    ),
    placementId: placement.id,
    status: (
      <PlayWithRewardStatusLabel
        playWithRewardServingStatus={
          PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_ACTIVE
        }
      />
    ),
    location: translateKey(
      translationKey('Title.InExperience', TranslationNamespace.ImmersiveAdsAnalytics),
    ),
    rewardItem: translateKey(
      translationKey('Label.CustomIntegration', TranslationNamespace.ImmersiveAdsAnalytics),
    ),
    lastUpdate: formatLastUpdate(placement.updatedTimestampMs),
    actions: placement.defaultPlacement ? undefined : (
      <RewardTableRowMenu
        ariaLabel={translateKey(
          translationKey('Label.PlacementActions', TranslationNamespace.ImmersiveAdsAnalytics),
        )}
        className='invisible group-hover:visible'
        items={[
          {
            key: 'edit',
            label: translate('Label.Edit'),
            onSelect: () => handleEditClick(placement.id, placement.name),
          },
        ]}
      />
    ),
  }));

  const inExperiencePlacementTable = <RewardTable rows={inExperienceRows} />;

  return (
    <div className={placementTabContainer}>
      {showPlayWithRewardSettings ? (
        <>
          <div className={placementTableContainer}>
            <div
              className={cx(
                placementTableHeaderContainer,
                !hasPlayWithRewardPlacementRow && '!padding-bottom-large',
              )}>
              <div className={placementTableTextContainer}>
                <div className={placementTableTitleTextContainer}>
                  <Typography variant='h5'>{translate('Title.ExperienceDetailsPage')}</Typography>
                </div>
                <Typography variant='body2' color='secondary'>
                  {translateHTML(
                    translationKey(
                      'Description.PlayWithRewardPlacements',
                      TranslationNamespace.ImmersiveAdsAnalytics,
                    ),
                    [
                      {
                        opening: 'linkStart',
                        closing: 'linkEnd',
                        content: ExperienceDetailsPageDocsLink,
                      },
                    ],
                  )}
                </Typography>
              </div>
              {!isPlayWithRewardPlacementVisible(playWithRewardServingStatus) && (
                <Button
                  color='secondary'
                  size='medium'
                  variant='contained'
                  component={NextLink}
                  href={createPlacementUrl}>
                  {translate('Label.Create')}
                </Button>
              )}
            </div>
            {hasPlayWithRewardPlacementRow && playWithRewardTable}
          </div>
          <div className={placementTableContainer}>
            <div className={placementTableHeaderContainer}>
              <div className={placementTableTextContainer}>
                <div className={placementTableTitleTextContainer}>
                  <Typography variant='h5'>{translate('Title.InExperience')}</Typography>
                  <Typography variant='body2' color='secondary'>
                    ({placements?.length}/{MAX_PLACEMENTS})
                  </Typography>
                </div>
                <Typography variant='body2' color='secondary'>
                  {translateHTML(
                    translationKey(
                      'Description.InExperiencePlacements',
                      TranslationNamespace.ImmersiveAdsAnalytics,
                    ),
                    [
                      {
                        opening: 'linkStart',
                        closing: 'linkEnd',
                        content: ExperienceDetailsPageDocsLink,
                      },
                    ],
                  )}
                </Typography>
              </div>
              <Tooltip placement='left' title={getInExperienceTooltipTitle()}>
                <span>
                  <Button
                    color='secondary'
                    size='medium'
                    variant='contained'
                    disabled={isDisabled}
                    onClick={handleCreateClick}>
                    {translate('Label.Create')}
                  </Button>
                </span>
              </Tooltip>
            </div>
            {inExperiencePlacementTable}
          </div>
        </>
      ) : (
        <>
          <div className={descriptionStyle}>
            <Typography>
              {/* oxlint-disable-next-line rbx/no-hardcoded-translation-string -- pre-existing */}
              Create and manage ad placements to start serving video ads within your experience.
            </Typography>
          </div>
          <div className={createPlacementButtonRowContainer}>
            <Tooltip placement='right' title={getInExperienceTooltipTitle()}>
              <span>
                <Button
                  color='primaryBrand'
                  size='medium'
                  variant='contained'
                  disabled={isDisabled}
                  onClick={handleCreateClick}>
                  {translate('Label.CreatePlacement')}
                </Button>
              </span>
            </Tooltip>
            <Typography variant='body2' color='secondary'>
              {/* oxlint-disable-next-line rbx/no-hardcoded-translation-string -- pre-existing */}
              {placements?.length}/{MAX_PLACEMENTS} Placement Created
            </Typography>
          </div>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {/* oxlint-disable-next-line rbx/no-hardcoded-translation-string -- pre-existing */}
                  <TableCell>Placement</TableCell>
                  {/* oxlint-disable-next-line rbx/no-hardcoded-translation-string -- pre-existing */}
                  <TableCell>Placement ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {placements.map((placement) => (
                  <TableRow key={placement.id} className={tableRow} hover>
                    <TableCell className={placementNameTableCell}>
                      <div className={placementNameContainer}>
                        {placement.name}
                        {placement.defaultPlacement && (
                          <Tooltip placement='right' title={translate('Tooltip.DefaultPlacement')}>
                            <LockIcon color='disabled' className={lockIcon} />
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={placementIdTableCell}>
                      <div className={placementIdContainer}>
                        {placement.id}
                        {!placement.defaultPlacement && (
                          <IconButton
                            aria-label='Edit placement'
                            size='small'
                            onClick={() => handleEditClick(placement.id, placement.name)}
                            // oxlint-disable-next-line better-tailwindcss/no-unknown-classes -- pre-existing
                            className={cx(editIconButton, 'editIconButtonClass')}>
                            <EditOutlinedIcon fontSize='medium' color='secondary' />
                          </IconButton>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
      {isModalOpen && modalContent}
      {isEnableTestModeModalOpen && (
        <EnablePlayWithRewardTestModeDialog
          onConfirm={handleConfirmEnableTestMode}
          onClose={handleCloseEnableTestModeModal}
        />
      )}
      {isDisablePlacementModalOpen && (
        <DisablePlayWithRewardPlacementDialog
          isPending={isUpdatingPlayWithRewardEnabled}
          onConfirm={handleDisablePlacement}
          onClose={handleCloseDisablePlacementModal}
        />
      )}
      {isLaunchPlacementModalOpen && (
        <LaunchPlayWithRewardPlacementDialog
          onConfirm={handleConfirmLaunchPlacement}
          onClose={handleCloseLaunchPlacementModal}
        />
      )}
    </div>
  );
};

export default withTranslation(ImmersiveAdsPlacementTabContent, [
  TranslationNamespace.ImmersiveAdsAnalytics,
]);

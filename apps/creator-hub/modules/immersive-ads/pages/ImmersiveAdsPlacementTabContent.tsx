import React, { useCallback, useRef, useState } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
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
  Menu,
  MenuItem,
  InfoOutlinedIcon,
  MoreVertIcon,
  Avatar,
  CloseIcon,
} from '@rbx/ui';
import developerAdsStatsClient from '@modules/clients/developerAdsStats';
import { useSnackbarAlert } from '@modules/miscellaneous/hooks';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { PlayWithRewardServingStatus } from '@rbx/clients/developerAdsStatsApi';
import ExperienceDetailsPageDocsLink from '../components/ExperienceDetailsPageDocsLink';
import useImmersiveAdsPageStyles from './ImmersiveAdsPage.styles';
import useModal from '../hooks/useModal';
import PlacementModal from '../components/PlacementModal';
import { Placement } from '../types/placementTypes';
import PlayWithRewardStatusLabel from '../components/PlayWithRewardStatusLabel';

interface ImmersiveAdsPlacementTabContentProps {
  universeId: number;
  placements: Placement[];
  isLoading: boolean;
  error: Error | null;
  onRefreshPlacements: () => void;
  onOpenCreatePlayWithRewardModal: () => void;
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

const isPlayWithRewardPlacementVisible = (status: PlayWithRewardServingStatus) => {
  return !(
    status === PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_NONE ||
    status === PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_UNSPECIFIED
  );
};

const isPlayWithRewardPlacementDeactivated = (status: PlayWithRewardServingStatus) => {
  return status === PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_INACTIVE_DISABLED;
};

const isPlayWithRewardPlacementRejected = (status: PlayWithRewardServingStatus) => {
  return status === PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_INACTIVE_REJECTED;
};

const ImmersiveAdsPlacementTabContent: React.FC<ImmersiveAdsPlacementTabContentProps> = ({
  universeId,
  placements,
  isLoading,
  error,
  onRefreshPlacements,
  onOpenCreatePlayWithRewardModal,
  showPlayWithRewardSettings = false,
  rewardMetadata,
  playWithRewardServingStatus,
  onRefreshPlayWithRewardServingStatus,
}) => {
  const [isRejectedAlertDismissed, setIsRejectedAlertDismissed] = useState(false);

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
      avatarContainer,
      menuIconButton,
      playWithRewardRejectedAlert,
      playWithRewardRejectedAlertAction,
      descriptionStyle,
      createPlacementButtonRowContainer,
    },
  } = useImmersiveAdsPageStyles();
  const { translate, translateHTML } = useTranslation();
  const showSnackbarMessage = useSnackbarAlert();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const { isModalOpen, openModal, closeModal, modalContent } = useModal();
  const [openPlayWithRewardMenu, setOpenPlayWithRewardMenu] = useState(false);

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

  const handlePlayWithRewardDeactivate = useCallback(async () => {
    try {
      await developerAdsStatsClient.updateUniverseAdsSettings({
        universeId,
        updateUniverseAdsSettingsRequest: {
          isPlayWithRewardEnabled: false,
        },
      });
      onRefreshPlayWithRewardServingStatus();
      setOpenPlayWithRewardMenu(false);
      showSnackbarMessage('success', translate('Description.PlacementDeactivated'));
    } catch {
      showSnackbarMessage('error', translate('Label.PlacementUpdateError'));
    }
  }, [universeId, showSnackbarMessage, translate, onRefreshPlayWithRewardServingStatus]);

  const handlePlayWithRewardEdit = useCallback(() => {
    setOpenPlayWithRewardMenu(false);
    onOpenCreatePlayWithRewardModal();
  }, [onOpenCreatePlayWithRewardModal]);

  const playWithRewardActionMenu = (
    <Menu
      anchorEl={menuButtonRef.current}
      open={openPlayWithRewardMenu}
      onClose={() => setOpenPlayWithRewardMenu(false)}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}>
      {isPlayWithRewardPlacementDeactivated(playWithRewardServingStatus) ? (
        <MenuItem onClick={handlePlayWithRewardEdit}>{translate('Label.Enable')}</MenuItem>
      ) : (
        <React.Fragment>
          <MenuItem onClick={handlePlayWithRewardEdit}>{translate('Label.Edit')}</MenuItem>
          <MenuItem
            onClick={handlePlayWithRewardDeactivate}
            disabled={
              playWithRewardServingStatus ===
                PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_INACTIVE_REJECTED ||
              playWithRewardServingStatus ===
                PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_INACTIVE_SUSPENDED
            }>
            {translate('Label.Deactivate')}
          </MenuItem>
        </React.Fragment>
      )}
    </Menu>
  );

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

  const rejectedAlert = (
    <Alert
      severity='error'
      className={playWithRewardRejectedAlert}
      action={
        <div className={playWithRewardRejectedAlertAction}>
          <Button color='inherit' size='small' onClick={onOpenCreatePlayWithRewardModal}>
            {translate('Label.TryAgain')}
          </Button>
          <IconButton
            aria-label='close'
            color='inherit'
            size='small'
            onClick={() => setIsRejectedAlertDismissed(true)}>
            <CloseIcon fontSize='inherit' />
          </IconButton>
        </div>
      }>
      {translate('Description.PlacementModerationRejected')}
    </Alert>
  );

  const playWithRewardTable = (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{translate('Heading.PlacementName')}</TableCell>
            <TableCell>{translate('Heading.RewardItem')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow className={tableRow} hover>
            <TableCell className={placementNameTableCell}>
              <div className={placementNameContainer}>
                <Typography
                  variant='body2'
                  color={
                    isPlayWithRewardPlacementDeactivated(playWithRewardServingStatus)
                      ? 'disabled'
                      : 'primary'
                  }>
                  {translate('Label.OnExperienceJoin')}
                </Typography>
                <Tooltip placement='right' title=''>
                  <LockIcon color='disabled' className={lockIcon} />
                </Tooltip>
                <PlayWithRewardStatusLabel
                  playWithRewardServingStatus={playWithRewardServingStatus}
                />
              </div>
            </TableCell>
            <TableCell className={placementIdTableCell}>
              <div className={placementIdContainer}>
                <div className={placementNameContainer}>
                  {rewardMetadata?.displayDetails && rewardMetadata.displayDetails.imageAssetId && (
                    <Avatar variant='circular' alt='avatar' className={avatarContainer}>
                      <Thumbnail2d
                        type={ThumbnailTypes.assetThumbnail}
                        targetId={rewardMetadata.displayDetails.imageAssetId}
                        alt='reward thumbnail'
                      />
                    </Avatar>
                  )}
                  <Typography
                    variant='body2'
                    color={
                      isPlayWithRewardPlacementDeactivated(playWithRewardServingStatus)
                        ? 'disabled'
                        : 'primary'
                    }>
                    {rewardMetadata?.displayDetails?.productName}
                  </Typography>
                </div>
                <IconButton
                  onClick={() => setOpenPlayWithRewardMenu((prev) => !prev)}
                  size='small'
                  aria-label='Edit placement'
                  className={`${menuIconButton} menuIconButtonClass`}
                  ref={menuButtonRef}>
                  <MoreVertIcon color='secondary' />
                </IconButton>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );

  const inExperiencePlacementTable = (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{translate('Heading.PlacementName')}</TableCell>
            <TableCell>{translate('Heading.PlacementID')}</TableCell>
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
                      className={`${editIconButton} editIconButtonClass`}>
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
  );

  return (
    <div className={placementTabContainer}>
      {showPlayWithRewardSettings ? (
        <React.Fragment>
          <div className={placementTableContainer}>
            <div className={placementTableHeaderContainer}>
              <div className={placementTableTextContainer}>
                <div className={placementTableTitleTextContainer}>
                  <Typography variant='h5'>{translate('Title.ExperienceDetailsPage')}</Typography>
                  <Tooltip
                    placement='right'
                    title={translate('Tooltip.PlayWithRewardPlacementsInfo')}
                    arrow>
                    <InfoOutlinedIcon color='secondary' fontSize='medium' />
                  </Tooltip>
                </div>
                {!isPlayWithRewardPlacementVisible(playWithRewardServingStatus) && (
                  <Typography variant='body2' color='secondary'>
                    {translateHTML('Description.PlayWithRewardPlacements', [
                      {
                        opening: 'linkStart',
                        closing: 'linkEnd',
                        content: ExperienceDetailsPageDocsLink,
                      },
                    ])}
                  </Typography>
                )}
              </div>
              {!isPlayWithRewardPlacementVisible(playWithRewardServingStatus) && (
                <Button
                  color='secondary'
                  size='medium'
                  variant='contained'
                  onClick={onOpenCreatePlayWithRewardModal}>
                  {translate('Label.Create')}
                </Button>
              )}
            </div>
            {isPlayWithRewardPlacementRejected(playWithRewardServingStatus) &&
              !isRejectedAlertDismissed &&
              rejectedAlert}
            {rewardMetadata &&
              isPlayWithRewardPlacementVisible(playWithRewardServingStatus) &&
              playWithRewardTable}
            {playWithRewardActionMenu}
          </div>
          <div className={placementTableContainer}>
            <div className={placementTableHeaderContainer}>
              <div className={placementTableTitleTextContainer}>
                <Typography variant='h5'>{translate('Title.InExperience')}</Typography>
                <Typography variant='body2' color='secondary'>
                  ({placements?.length}/{MAX_PLACEMENTS})
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
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className={descriptionStyle}>
            <Typography>
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
              {placements?.length}/{MAX_PLACEMENTS} Placement Created
            </Typography>
          </div>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Placement</TableCell>
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
                            className={`${editIconButton} editIconButtonClass`}>
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
        </React.Fragment>
      )}
      {isModalOpen && modalContent}
    </div>
  );
};

export default withTranslation(ImmersiveAdsPlacementTabContent, [
  TranslationNamespace.ImmersiveAdsAnalytics,
]);

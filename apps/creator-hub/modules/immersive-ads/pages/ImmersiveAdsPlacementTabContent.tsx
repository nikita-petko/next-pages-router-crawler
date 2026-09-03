import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  PlacementRewardStatusEnum,
  UpdatePlacementRequestStatusEnum,
} from '@rbx/client-developer-ads-stats-api/v1';
import {
  Button as FoundationButton,
  EducationalTooltip,
  EducationalTooltipBody,
  EducationalTooltipContent,
  EducationalTooltipDescription,
  EducationalTooltipTitle,
  EducationalTooltipTrigger,
  Icon,
  IconButton as FoundationIconButton,
  Menu as FoundationMenu,
  MenuItem as FoundationMenuItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip as FoundationTooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
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
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import developerAdsStatsClient from '@modules/clients/developerAdsStats';
import { useSnackbarAlert } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ExperienceDetailsPageDocsLink from '../components/ExperienceDetailsPageDocsLink';
import PlacementModal from '../components/PlacementModal';
import { DisablePlayWithRewardPlacementDialog } from '../components/PlayWithRewardConfirmationDialog';
import RewardItemsDrawer from '../components/RewardItemsDrawer';
import RewardTable, { type RewardTableRow } from '../components/RewardTable';
import StatusBadge from '../components/StatusBadge';
import useModal from '../hooks/useModal';
import {
  PlacementType,
  PlacementStatus,
  SHOW_MANAGE_TOOLTIP_QUERY_PARAM,
  type Placement,
  type PlacementReward,
} from '../types/placementTypes';
import useImmersiveAdsPageStyles from './ImmersiveAdsPage.styles';

interface ImmersiveAdsPlacementTabContentProps {
  universeId: number;
  placements: Placement[];
  isLoading: boolean;
  error: Error | null;
  onRefreshPlacements: () => void;
  createPlacementUrl: string;
  showPlayWithRewardSettings?: boolean;
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <FoundationIconButton
          as='button'
          variant='Utility'
          size='Medium'
          icon='icon-regular-three-dots-vertical'
          ariaLabel={ariaLabel}
          className={className}
        />
      </PopoverTrigger>
      <PopoverContent side='bottom' align='end' ariaLabel={ariaLabel}>
        <FoundationMenu size='Medium'>
          {items.map((item) => (
            <FoundationMenuItem
              key={item.key}
              value={item.key}
              title={item.label}
              disabled={item.isDisabled}
              onSelect={() => {
                item.onSelect();
                setIsOpen(false);
              }}
            />
          ))}
        </FoundationMenu>
      </PopoverContent>
    </Popover>
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
  const [isUpdatingPlayWithRewardEnabled, setIsUpdatingPlayWithRewardEnabled] = useState(false);
  const [isRewardItemsDrawerOpen, setIsRewardItemsDrawerOpen] = useState(false);
  const [showManageTooltip, setShowManageTooltip] = useState(false);
  const [maxProductIds, setMaxProductIds] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!router.isReady || router.query[SHOW_MANAGE_TOOLTIP_QUERY_PARAM] !== 'true') {
      return;
    }
    // oxlint-disable-next-line react/react-compiler -- consume the one-time navigation signal after router hydration.
    setShowManageTooltip(true);
    const nextQuery = { ...router.query };
    delete nextQuery[SHOW_MANAGE_TOOLTIP_QUERY_PARAM];
    void router.replace({ pathname: router.pathname, query: nextQuery }, undefined, {
      shallow: true,
    });
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    const fetchMetadata = async () => {
      try {
        const response = await developerAdsStatsClient.getImmersiveAdsMetadata();
        if (cancelled) {
          return;
        }
        setMaxProductIds(
          response.placementTypeDefaults?.[String(PlacementType.PlayWithReward)]?.maxProductIds,
        );
      } catch {
        // metadata is non-critical, fall through
      }
    };
    void fetchMetadata();
    return () => {
      cancelled = true;
    };
  }, []);

  const { isModalOpen, openModal, closeModal, modalContent } = useModal();

  const rewardedVideoPlacements = placements.filter(
    (placement) => placement.type !== PlacementType.PlayWithReward,
  );
  const pwrPlacement = placements.find(
    (placement) => placement.type === PlacementType.PlayWithReward,
  );

  const handlePlacementUpdate = useCallback(
    async (placementIdValue: number, newName: string) => {
      try {
        const response = await developerAdsStatsClient.updatePlacement({
          adPlacementId: placementIdValue,
          updatePlacementRequest: {
            name: newName.trim(),
            universeId,
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
    [closeModal, onRefreshPlacements, showSnackbarMessage, translate, universeId],
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

  const handleCloseDisablePlacementModal = useCallback(() => {
    setIsDisablePlacementModalOpen(false);
  }, []);

  const handleOpenDisablePlacementModal = useCallback(() => {
    setIsDisablePlacementModalOpen(true);
  }, []);

  const handleDisablePlacement = useCallback(async () => {
    if (!pwrPlacement) {
      return;
    }
    setIsUpdatingPlayWithRewardEnabled(true);
    try {
      await developerAdsStatsClient.updatePlacement({
        adPlacementId: pwrPlacement.id,
        updatePlacementRequest: {
          status: UpdatePlacementRequestStatusEnum.PLACEMENT_STATUS_INACTIVE,
          universeId,
        },
      });
      handleCloseDisablePlacementModal();
      onRefreshPlacements();
      showSnackbarMessage('success', translate('Description.PlacementDeactivated'));
    } catch {
      showSnackbarMessage('error', translate('Label.PlacementUpdateError'));
    } finally {
      setIsUpdatingPlayWithRewardEnabled(false);
    }
  }, [
    handleCloseDisablePlacementModal,
    onRefreshPlacements,
    pwrPlacement,
    showSnackbarMessage,
    translate,
    universeId,
  ]);

  const handleEnablePlacement = useCallback(async () => {
    if (!pwrPlacement) {
      return;
    }
    setIsUpdatingPlayWithRewardEnabled(true);
    try {
      await developerAdsStatsClient.updatePlacement({
        adPlacementId: pwrPlacement.id,
        updatePlacementRequest: {
          status: UpdatePlacementRequestStatusEnum.PLACEMENT_STATUS_ACTIVE,
          universeId,
        },
      });
      onRefreshPlacements();
      showSnackbarMessage('success', translate('Label.PlacementCreatedSuccess'));
    } catch {
      showSnackbarMessage('error', translate('Label.PlacementUpdateError'));
    } finally {
      setIsUpdatingPlayWithRewardEnabled(false);
    }
  }, [onRefreshPlacements, pwrPlacement, showSnackbarMessage, translate, universeId]);

  const handleCloseRewardItemsDrawer = useCallback(() => {
    setIsRewardItemsDrawerOpen(false);
  }, []);

  const handleOpenRewardItemsDrawer = useCallback(() => {
    setIsRewardItemsDrawerOpen(true);
  }, []);

  // Only the close affordance dismisses the one-time Manage tip; ignore trigger-click opens so
  // clicking Manage (which opens the drawer) can't re-surface it. It's shown via the nav signal.
  const handleManageTooltipOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      setShowManageTooltip(false);
    }
  }, []);

  const handleRewardUpdated = useCallback(() => {
    onRefreshPlacements();
    onRefreshPlayWithRewardServingStatus();
  }, [onRefreshPlacements, onRefreshPlayWithRewardServingStatus]);

  if (isLoading && !isRewardItemsDrawerOpen) {
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
          <Typography>{translate('Label.PlacementUpdateError')}</Typography>
        </Alert>
      </div>
    );
  }

  const isMaxPlacementsReached = rewardedVideoPlacements.length >= MAX_PLACEMENTS;
  const isDisabled = isMaxPlacementsReached || rewardedVideoPlacements.length === 0;

  const getInExperienceTooltipTitle = () => {
    if (rewardedVideoPlacements.length === 0) {
      return translate('Tooltip.NoDefaultPlacement');
    }
    if (isMaxPlacementsReached) {
      return translate('Tooltip.MaxPlacementReached');
    }
    return '';
  };

  const pwrRewards: PlacementReward[] = pwrPlacement?.rewards ?? [];
  const hasTestModeReward = pwrRewards.some(
    (r) =>
      r.status === PlacementRewardStatusEnum.REWARD_STATUS_TEST ||
      r.status === PlacementRewardStatusEnum.REWARD_STATUS_TEST_INVALID_IMAGE,
  );
  const hasActiveReward = pwrRewards.some(
    (r) => r.status === PlacementRewardStatusEnum.REWARD_STATUS_ACTIVE,
  );
  const hasDraftOrTestReward = pwrRewards.some(
    (r) =>
      r.status === PlacementRewardStatusEnum.REWARD_STATUS_DRAFT ||
      r.status === PlacementRewardStatusEnum.REWARD_STATUS_TEST ||
      r.status === PlacementRewardStatusEnum.REWARD_STATUS_TEST_INVALID_IMAGE,
  );
  const activeRewardCount = pwrRewards.filter(
    (r) => r.status === PlacementRewardStatusEnum.REWARD_STATUS_ACTIVE,
  ).length;

  const isPwrPlacementActive = pwrPlacement?.status === PlacementStatus.PLACEMENT_STATUS_ACTIVE;
  const derivedPlacementRewardStatus = (() => {
    if (!isPwrPlacementActive) {
      return PlacementRewardStatusEnum.REWARD_STATUS_INACTIVE;
    }
    if (hasTestModeReward) {
      return PlacementRewardStatusEnum.REWARD_STATUS_TEST;
    }
    if (hasActiveReward) {
      return PlacementRewardStatusEnum.REWARD_STATUS_ACTIVE;
    }
    return PlacementRewardStatusEnum.REWARD_STATUS_INACTIVE;
  })();

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
  const playWithRewardMenuItems: RewardRowMenuItem[] = isPwrPlacementActive
    ? [disablePlacementMenuItem, editPlacementMenuItem]
    : [enablePlacementMenuItem, editPlacementMenuItem];

  const playWithRewardRows: RewardTableRow[] = [
    {
      key: 'play-with-reward',
      name: (
        <div className={placementNameContainer}>
          <span className='text-body-medium'>{translate('Label.OnExperienceJoin')}</span>
          <LockIcon color='disabled' className={lockIcon} />
        </div>
      ),
      placementId: pwrPlacement ? pwrPlacement.id : EMPTY_CELL,
      status: <StatusBadge type='reward' status={derivedPlacementRewardStatus} />,
      rewardItem: hasDraftOrTestReward ? (
        <FoundationTooltip
          position='top-center'
          title={translateKey(
            translationKey(
              'Tooltip.RewardItemsInTestMode',
              TranslationNamespace.ImmersiveAdsAnalytics,
            ),
          )}
          description={translateKey(
            translationKey(
              'Tooltip.TestAndActivateRemaining',
              TranslationNamespace.ImmersiveAdsAnalytics,
            ),
          )}
          hasBeak>
          <TooltipTrigger asChild>
            <span className='gap-small flex items-center'>
              <Icon
                name='icon-regular-triangle-exclamation'
                size='Small'
                className='content-default'
              />
              <span className='text-body-medium'>
                {translateKey(
                  translationKey(
                    'Label.RewardItemCount',
                    TranslationNamespace.ImmersiveAdsAnalytics,
                  ),
                  {
                    active: String(activeRewardCount),
                    total: String(maxProductIds ?? pwrRewards.length),
                  },
                )}
              </span>
            </span>
          </TooltipTrigger>
        </FoundationTooltip>
      ) : (
        <span className='text-body-medium'>
          {translateKey(
            translationKey('Label.RewardItemCount', TranslationNamespace.ImmersiveAdsAnalytics),
            {
              active: String(activeRewardCount),
              total: String(maxProductIds ?? pwrRewards.length),
            },
          )}
        </span>
      ),
      lastUpdate: pwrPlacement ? formatLastUpdate(pwrPlacement.updatedTimestampMs) : EMPTY_CELL,
      actions: (
        <div className='flex width-full items-center justify-end gap-xsmall'>
          {isPwrPlacementActive && (
            <EducationalTooltip
              open={showManageTooltip}
              onOpenChange={handleManageTooltipOpenChange}>
              <EducationalTooltipTrigger asChild>
                <FoundationButton
                  variant='SoftEmphasis'
                  size='Medium'
                  onClick={handleOpenRewardItemsDrawer}>
                  {translateKey(
                    translationKey('Action.Manage', TranslationNamespace.ImmersiveAdsAnalytics),
                  )}
                </FoundationButton>
              </EducationalTooltipTrigger>
              <EducationalTooltipContent
                position='top-center'
                hasCloseAffordance
                closeLabel={translate('Action.Close')}
                hasBeak>
                <EducationalTooltipBody>
                  <EducationalTooltipTitle>
                    {translateKey(
                      translationKey(
                        'Title.TestPublishRewardItems',
                        TranslationNamespace.ImmersiveAdsAnalytics,
                      ),
                    )}
                  </EducationalTooltipTitle>
                  <EducationalTooltipDescription>
                    {translateHTML(
                      translationKey(
                        'Description.TestPublishRewardItems',
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
                  </EducationalTooltipDescription>
                </EducationalTooltipBody>
              </EducationalTooltipContent>
            </EducationalTooltip>
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

  const hasPlayWithRewardPlacementRow = Boolean(pwrPlacement);
  const playWithRewardTable = <RewardTable rows={playWithRewardRows} />;

  const inExperienceRows: RewardTableRow[] = rewardedVideoPlacements.map((placement) => ({
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
    status: <StatusBadge type='placement' status={placement.status} />,
    rewardItem: (
      <span className='text-body-medium'>
        {translateKey(
          translationKey('Label.CustomIntegration', TranslationNamespace.ImmersiveAdsAnalytics),
        )}
      </span>
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
            label: translateKey(
              translationKey('Action.EditPlacement', TranslationNamespace.ImmersiveAdsAnalytics),
            ),
            onSelect: () => handleEditClick(placement.id, placement.name),
          },
        ]}
      />
    ),
  }));

  const inExperiencePlacementTable = (
    <RewardTable rows={inExperienceRows} showCustomRewardedTooltip />
  );

  return (
    <div className={placementTabContainer}>
      {showPlayWithRewardSettings ? (
        <>
          <div
            className={cx(
              'margin-bottom-medium radius-medium stroke-standard stroke-default',
              !hasPlayWithRewardPlacementRow && 'padding-bottom-large',
            )}>
            <div className={placementTableHeaderContainer}>
              <div className={placementTableTextContainer}>
                <div className={placementTableTitleTextContainer}>
                  <Typography variant='h5'>
                    {translateKey(
                      translationKey(
                        'Title.ManagedRewarded',
                        TranslationNamespace.ImmersiveAdsAnalytics,
                      ),
                    )}
                  </Typography>
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
              {!hasPlayWithRewardPlacementRow && (
                <FoundationButton
                  variant='Standard'
                  size='Medium'
                  onClick={handlePlayWithRewardEdit}>
                  {translate('Label.Create')}
                </FoundationButton>
              )}
            </div>
            {hasPlayWithRewardPlacementRow && playWithRewardTable}
          </div>
          <div
            className={cx(
              'margin-bottom-large radius-medium stroke-standard stroke-default',
              rewardedVideoPlacements.length === 0 && 'padding-bottom-large',
            )}>
            <div className={placementTableHeaderContainer}>
              <div className={placementTableTextContainer}>
                <div className={placementTableTitleTextContainer}>
                  <Typography variant='h5'>
                    {translateKey(
                      translationKey(
                        'Title.CustomRewarded',
                        TranslationNamespace.ImmersiveAdsAnalytics,
                      ),
                    )}
                  </Typography>
                  <Typography variant='body2' color='secondary'>
                    ({rewardedVideoPlacements.length}/{MAX_PLACEMENTS})
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
                  <FoundationButton
                    variant='Standard'
                    size='Medium'
                    isDisabled={isDisabled}
                    onClick={handleCreateClick}>
                    {translate('Label.Create')}
                  </FoundationButton>
                </span>
              </Tooltip>
            </div>
            {rewardedVideoPlacements.length > 0 && inExperiencePlacementTable}
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
              {rewardedVideoPlacements.length}/{MAX_PLACEMENTS} Placement Created
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
                {rewardedVideoPlacements.map((placement) => (
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
      {isDisablePlacementModalOpen && (
        <DisablePlayWithRewardPlacementDialog
          isPending={isUpdatingPlayWithRewardEnabled}
          onConfirm={handleDisablePlacement}
          onClose={handleCloseDisablePlacementModal}
        />
      )}
      {pwrPlacement && (
        <RewardItemsDrawer
          open={isRewardItemsDrawerOpen}
          onClose={handleCloseRewardItemsDrawer}
          placementId={pwrPlacement.id}
          universeId={universeId}
          rewards={pwrRewards}
          onRewardUpdated={handleRewardUpdated}
          onEditSettings={handlePlayWithRewardEdit}
        />
      )}
    </div>
  );
};

export default withTranslation(ImmersiveAdsPlacementTabContent, [
  TranslationNamespace.ImmersiveAdsAnalytics,
]);

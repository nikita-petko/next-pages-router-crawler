import { useCallback, useState } from 'react';
import {
  Button,
  IconButton as FoundationIconButton,
  Menu as FoundationMenu,
  MenuItem as FoundationMenuItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SheetRoot,
  SheetContent,
  SheetTitle,
  SheetBody,
  SheetActions,
  Toggle,
  Tooltip,
  TooltipTrigger,
  Link,
} from '@rbx/foundation-ui';
import { useTranslation, useTranslationWithNamespace, withTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Avatar } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useSnackbarAlert } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useUpdatePlacementReward } from '../hooks/useUpdatePlacementReward';
import { PlacementRewardStatusEnum, type PlacementReward } from '../types/placementTypes';
import { PlacementRewardStatus, RewardAccessMode } from '../types/rewardTypes';
import StatusBadge from './StatusBadge';

interface RewardItemsDrawerProps {
  open: boolean;
  onClose: () => void;
  placementId: number;
  universeId: number;
  rewards: PlacementReward[];
  onRewardUpdated: () => void;
}

const isToggleable = (status: PlacementRewardStatusEnum): boolean =>
  status === PlacementRewardStatusEnum.REWARD_STATUS_ACTIVE ||
  status === PlacementRewardStatusEnum.REWARD_STATUS_INACTIVE;

// A reward in test access mode, including one flagged for an unapproved image.
const isTestModeStatus = (status: PlacementRewardStatusEnum): boolean =>
  status === PlacementRewardStatusEnum.REWARD_STATUS_TEST ||
  status === PlacementRewardStatusEnum.REWARD_STATUS_TEST_INVALID_IMAGE;

function RewardItemsDrawer({
  open,
  onClose,
  placementId,
  universeId,
  rewards,
  onRewardUpdated,
}: RewardItemsDrawerProps) {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.ImmersiveAdsAnalytics);
  const { translate: translateKey } = useTranslationWrapper(useTranslation());
  const showSnackbarMessage = useSnackbarAlert();
  const { mutate: updateReward, isLoading } = useUpdatePlacementReward();

  const handleToggleEnable = useCallback(
    async (reward: PlacementReward, enabled: boolean) => {
      try {
        await updateReward({
          placementId,
          productId: reward.productId,
          universeId,
          status: enabled
            ? PlacementRewardStatus.PLACEMENT_REWARD_STATUS_ACTIVE
            : PlacementRewardStatus.PLACEMENT_REWARD_STATUS_INACTIVE,
          // Publish fully on enable so a reward left at accessMode TEST doesn't re-derive as TEST.
          ...(enabled && { accessMode: RewardAccessMode.PLACEMENT_REWARD_ACCESS_MODE_FULL }),
        });
        onRewardUpdated();
      } catch {
        showSnackbarMessage('error', translate('Label.PlacementUpdateError'));
      }
    },
    [placementId, universeId, updateReward, onRewardUpdated, showSnackbarMessage, translate],
  );

  const handleAccessModeChange = useCallback(
    async (reward: PlacementReward, accessMode: RewardAccessMode) => {
      try {
        await updateReward({
          placementId,
          productId: reward.productId,
          universeId,
          accessMode,
        });
        if (accessMode === RewardAccessMode.PLACEMENT_REWARD_ACCESS_MODE_FULL) {
          const nextDraft = rewards.find(
            (r) =>
              r.productId !== reward.productId &&
              r.status === PlacementRewardStatusEnum.REWARD_STATUS_DRAFT,
          );
          if (nextDraft) {
            await updateReward({
              placementId,
              productId: nextDraft.productId,
              universeId,
              status: PlacementRewardStatus.PLACEMENT_REWARD_STATUS_ACTIVE,
              accessMode: RewardAccessMode.PLACEMENT_REWARD_ACCESS_MODE_TEST,
            });
          }
        }
        onRewardUpdated();
      } catch {
        showSnackbarMessage('error', translate('Label.PlacementUpdateError'));
      }
    },
    [
      placementId,
      universeId,
      rewards,
      updateReward,
      onRewardUpdated,
      showSnackbarMessage,
      translate,
    ],
  );

  const handleTestDraftReward = useCallback(
    async (reward: PlacementReward) => {
      try {
        const otherTestRewards = rewards.filter(
          (r) => r.productId !== reward.productId && isTestModeStatus(r.status),
        );
        for (const r of otherTestRewards) {
          await updateReward({
            placementId,
            productId: r.productId,
            universeId,
            // Leave the TEST access mode intact so the demoted reward returns to draft rather than
            // published; re-enabling it then goes through the test -> publish flow again.
            status: PlacementRewardStatus.PLACEMENT_REWARD_STATUS_INACTIVE,
          });
        }
        await updateReward({
          placementId,
          productId: reward.productId,
          universeId,
          status: PlacementRewardStatus.PLACEMENT_REWARD_STATUS_ACTIVE,
          accessMode: RewardAccessMode.PLACEMENT_REWARD_ACCESS_MODE_TEST,
        });
        onRewardUpdated();
      } catch {
        showSnackbarMessage('error', translate('Label.PlacementUpdateError'));
      }
    },
    [
      placementId,
      universeId,
      rewards,
      updateReward,
      onRewardUpdated,
      showSnackbarMessage,
      translate,
    ],
  );

  const [activeMenuOpenFor, setActiveMenuOpenFor] = useState<number | null>(null);

  const handleSheetOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        onClose();
      }
    },
    [onClose],
  );

  const renderActionButton = (reward: PlacementReward) => {
    switch (reward.status) {
      case PlacementRewardStatusEnum.REWARD_STATUS_UNSPECIFIED:
      case PlacementRewardStatusEnum.REWARD_STATUS_ACTIVE:
      case PlacementRewardStatusEnum.REWARD_STATUS_INACTIVE:
        return (
          <div className='flex width-full justify-end'>
            <Popover
              open={activeMenuOpenFor === reward.productId}
              onOpenChange={(isOpen) => setActiveMenuOpenFor(isOpen ? reward.productId : null)}>
              <PopoverTrigger asChild>
                <FoundationIconButton
                  as='button'
                  variant='Utility'
                  size='Small'
                  icon='icon-regular-three-dots-vertical'
                  ariaLabel={translate('Label.RewardActions')}
                  className='invisible group-hover:visible'
                />
              </PopoverTrigger>
              <PopoverContent
                side='bottom'
                align='end'
                ariaLabel={translate('Label.RewardActions')}>
                <FoundationMenu size='Medium'>
                  <FoundationMenuItem
                    value='enable-test-mode'
                    title={translate('Action.EnableTestMode')}
                    disabled={isLoading}
                    onSelect={() => {
                      void handleTestDraftReward(reward);
                      setActiveMenuOpenFor(null);
                    }}
                  />
                </FoundationMenu>
              </PopoverContent>
            </Popover>
          </div>
        );
      case PlacementRewardStatusEnum.REWARD_STATUS_TEST:
        return (
          <Button
            variant='SoftEmphasis'
            size='Small'
            isDisabled={isLoading}
            onClick={() =>
              handleAccessModeChange(reward, RewardAccessMode.PLACEMENT_REWARD_ACCESS_MODE_FULL)
            }>
            {translate('Action.PublishReward')}
          </Button>
        );
      case PlacementRewardStatusEnum.REWARD_STATUS_TEST_INVALID_IMAGE:
        return (
          <Tooltip title={translate('Warning.RewardItemImageUnderReview')} position='top-center'>
            <TooltipTrigger asChild>
              <span className='inline-flex'>
                <Button variant='SoftEmphasis' size='Small' isDisabled>
                  {translate('Action.PublishReward')}
                </Button>
              </span>
            </TooltipTrigger>
          </Tooltip>
        );
      case PlacementRewardStatusEnum.REWARD_STATUS_DRAFT:
        return (
          <Button
            variant='Standard'
            size='Small'
            isDisabled={isLoading}
            onClick={() => handleTestDraftReward(reward)}>
            {translate('Action.TestReward')}
          </Button>
        );
      case PlacementRewardStatusEnum.REWARD_STATUS_INVALID:
      default:
        return null;
    }
  };

  return (
    <SheetRoot open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        largeScreenVariant='side'
        closeLabel={translate('Action.Close')}
        largeScreenClassName='!width-[608px] !max-width-[608px]'>
        <SheetTitle className='!padding-bottom-none'>
          {translate('Heading.JoinWithReward')}
        </SheetTitle>
        <SheetBody>
          <p className='text-body-small content-default margin-bottom-medium'>
            {translate('Description.RewardItemsDrawer')}{' '}
            <Link href='https://create.roblox.com/docs' size='Small' color='Emphasis'>
              {translate('Label.LearnMore')}
            </Link>
          </p>

          <div className='flex flex-col gap-none'>
            <div className='flex items-center gap-medium padding-y-small [border-bottom:var(--stroke-thin)_solid_var(--color-stroke-default)]'>
              <div className='shrink-0 width-[56px]'>
                <span className='text-caption-medium content-muted'>
                  {translate('Label.Enable')}
                </span>
              </div>
              <div className='grow-1 min-width-0'>
                <span className='text-caption-medium content-muted'>
                  {translate('Label.RewardItem')}
                </span>
              </div>
              <div className='shrink-0 width-[120px]'>
                <span className='text-caption-medium content-muted'>
                  {translate('Label.Status')}
                </span>
              </div>
              <div className='shrink-0 width-[120px]'>
                <span className='text-caption-medium content-muted'>
                  {translate('Label.Action')}
                </span>
              </div>
            </div>

            {rewards.map((reward) => (
              <div
                key={reward.productId}
                className='group flex items-center gap-medium padding-y-large [border-bottom:var(--stroke-thin)_solid_var(--color-stroke-default)]'>
                <div className='shrink-0 width-[56px]'>
                  <Toggle
                    size='Medium'
                    placement='Start'
                    isChecked={
                      reward.status === PlacementRewardStatusEnum.REWARD_STATUS_ACTIVE ||
                      isTestModeStatus(reward.status)
                    }
                    onCheckedChange={(checked) => handleToggleEnable(reward, checked)}
                    isDisabled={isLoading || !isToggleable(reward.status)}
                    aria-label={translateKey(
                      translationKey(
                        'Label.EnableRewardItem',
                        TranslationNamespace.ImmersiveAdsAnalytics,
                      ),
                      { name: reward.name },
                    )}
                  />
                </div>
                <div className='grow-1 min-width-0 flex items-center gap-small'>
                  <div className='shrink-0'>
                    {reward.imageAssetId ? (
                      <Avatar
                        variant='rounded'
                        alt={reward.name}
                        className='width-[34px] height-[34px]'>
                        <Thumbnail2d
                          type={ThumbnailTypes.assetThumbnail}
                          targetId={reward.imageAssetId}
                          alt={reward.name}
                        />
                      </Avatar>
                    ) : (
                      <div className='width-[34px] height-[34px] radius-medium bg-surface-200' />
                    )}
                  </div>
                  <div className='min-width-0 flex flex-col'>
                    <span className='text-body-medium text-no-wrap text-truncate-end'>
                      {reward.name}
                    </span>
                    <span className='text-caption-medium content-muted'>{reward.productId}</span>
                  </div>
                </div>
                <div className='shrink-0 width-[120px]'>
                  <StatusBadge type='reward' status={reward.status} />
                </div>
                <div className='shrink-0 width-[120px] flex'>{renderActionButton(reward)}</div>
              </div>
            ))}
          </div>
        </SheetBody>
        <SheetActions>
          <Button variant='Standard' size='Medium' onClick={onClose} className='width-full'>
            {translate('Action.Close')}
          </Button>
          <p className='text-caption-medium content-muted margin-top-medium'>
            {translate('Description.ProcessReceiptAcknowledgment')}
          </p>
        </SheetActions>
      </SheetContent>
    </SheetRoot>
  );
}

export default withTranslation(RewardItemsDrawer, [TranslationNamespace.ImmersiveAdsAnalytics]);

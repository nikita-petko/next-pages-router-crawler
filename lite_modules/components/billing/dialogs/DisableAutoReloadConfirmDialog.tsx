import { Button } from '@rbx/foundation-ui';
import { useQuery } from '@tanstack/react-query';
import { type ReactElement, useMemo, useState } from 'react';

import UniverseThumbnail from '@components/common/creative/UniverseThumbnail';
import { openDialog } from '@components/common/dialog/actions';
import BaseDialog from '@components/common/dialog/BaseDialog';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { getUniverses } from '@services/ads/getUniversesService';
import type { CreatorWorkspace } from '@type/groupScopedAccount';
import type { AutoReloadCampaign } from '@type/payment';
import type { Universe } from '@type/universe';
import { MicroUsdToUsdStringRoundedUpNoDecimals } from '@utils/currency';
import { CaptureException } from '@utils/error';

interface DisableAutoReloadConfirmDialogProps extends BaseInjectedDialogProps {
  autoReloadCampaigns: AutoReloadCampaign[];
  onConfirm: () => Promise<void>;
  workspace?: CreatorWorkspace;
}

interface UniverseReloadTotals {
  campaignCount: number;
  dailyReloadAmount: number;
}

interface OutsideWorkspaceExperience extends UniverseReloadTotals {
  id: number;
  name: string;
}

const PREVIEW_EXPERIENCE_LIMIT = 2;

/**
 * The games lookup passes every universe ID in a single query string, which the
 * endpoint rejects past its own cap. This preview is supplementary help text, so
 * we look up only the highest-spend experiences; beyond the cap the overflow
 * count understates rather than the whole list failing to resolve.
 */
const UNIVERSE_LOOKUP_LIMIT = 100;

const getUniverseReloadTotals = (
  campaigns: AutoReloadCampaign[],
): Map<number, UniverseReloadTotals> =>
  campaigns.reduce<Map<number, UniverseReloadTotals>>((result, campaign) => {
    if (campaign.universe_id === undefined) {
      return result;
    }
    const totals = result.get(campaign.universe_id) ?? {
      campaignCount: 0,
      dailyReloadAmount: 0,
    };
    totals.campaignCount += 1;
    totals.dailyReloadAmount += campaign.daily_reload_amount;
    result.set(campaign.universe_id, totals);
    return result;
  }, new Map<number, UniverseReloadTotals>());

const getOutsideWorkspaceExperiences = (
  universeReloadTotals: Map<number, UniverseReloadTotals>,
  universes: Universe[],
  workspace?: CreatorWorkspace,
): OutsideWorkspaceExperience[] => {
  if (workspace?.creatorId === undefined || workspace.creatorType === undefined) {
    return [];
  }

  return universes
    .filter(
      (universe) =>
        universe.creator.id !== workspace.creatorId ||
        universe.creator.type.toLowerCase() !== workspace.creatorType?.toLowerCase(),
    )
    .flatMap((universe) => {
      const totals = universeReloadTotals.get(universe.id);
      if (totals === undefined) {
        return [];
      }
      return [{ ...totals, id: universe.id, name: universe.name }];
    })
    .sort((left, right) => right.dailyReloadAmount - left.dailyReloadAmount);
};

const DisableAutoReloadConfirmDialog = ({
  autoReloadCampaigns,
  onClose,
  onConfirm,
  setDismissible,
  workspace,
}: DisableAutoReloadConfirmDialogProps): ReactElement => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  const [isPending, setIsPending] = useState<boolean>(false);
  const universeReloadTotals = useMemo(
    () => getUniverseReloadTotals(autoReloadCampaigns),
    [autoReloadCampaigns],
  );
  const universeIds = useMemo(
    () =>
      [...universeReloadTotals.entries()]
        .sort(([, left], [, right]) => right.dailyReloadAmount - left.dailyReloadAmount)
        .slice(0, UNIVERSE_LOOKUP_LIMIT)
        .map(([universeId]) => universeId),
    [universeReloadTotals],
  );
  const { data: universes = [] } = useQuery({
    enabled:
      universeIds.length > 0 &&
      workspace?.creatorId !== undefined &&
      workspace.creatorType !== undefined,
    queryFn: () => getUniverses(universeIds),
    queryKey: ['autoReloadOutsideWorkspaceExperiences', universeIds],
    retry: false,
    select: (response) => response.data ?? [],
  });
  const outsideWorkspaceExperiences = useMemo(
    () => getOutsideWorkspaceExperiences(universeReloadTotals, universes, workspace),
    [universeReloadTotals, universes, workspace],
  );
  const previewExperiences = outsideWorkspaceExperiences.slice(0, PREVIEW_EXPERIENCE_LIMIT);
  const remainingExperienceCount = outsideWorkspaceExperiences.length - previewExperiences.length;

  const handleConfirm = async (): Promise<void> => {
    if (isPending) {
      return;
    }
    setIsPending(true);
    setDismissible(false);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      CaptureException(error);
    } finally {
      setIsPending(false);
      setDismissible(true);
    }
  };

  return (
    <BaseDialog
      dialogBody={
        <div className='flex flex-col gap-y-small'>
          <p className='text-body-medium margin-none'>
            {translate('Description.DisableAllAutoReloadWarningPart1')}
          </p>
          <p className='text-body-medium margin-none'>
            {translate('Description.DisableAllAutoReloadWarningPart2')}
          </p>
          <p className='text-body-medium margin-none'>
            {translate('Description.DisableAllAutoReloadScope')}
          </p>
          {previewExperiences.length > 0 && workspace?.creatorName ? (
            <div className='flex flex-col gap-medium padding-medium radius-medium bg-surface-200'>
              <span className='text-title-small content-emphasis'>
                {translate('Heading.OutsideWorkspaceExperiences', {
                  workspaceName: workspace.creatorName,
                })}
              </span>
              {previewExperiences.map((experience) => (
                <div className='flex items-center gap-small' key={experience.id}>
                  <UniverseThumbnail universeId={experience.id} />
                  <div className='flex min-width-0 flex-col'>
                    <span className='text-body-medium content-emphasis'>{experience.name}</span>
                    <span className='text-body-small content-muted'>
                      {translate('Description.OutsideExperienceFunding', {
                        amount: MicroUsdToUsdStringRoundedUpNoDecimals(
                          experience.dailyReloadAmount,
                        ),
                        campaignCount: experience.campaignCount.toString(),
                      })}
                    </span>
                  </div>
                </div>
              ))}
              {remainingExperienceCount > 0 ? (
                <span className='text-body-small content-muted'>
                  {translate('Description.MoreOutsideExperiences', {
                    experienceCount: remainingExperienceCount.toString(),
                  })}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      }
      dialogFooter={
        <>
          <Button
            isDisabled={isPending}
            isLoading={isPending}
            onClick={handleConfirm}
            size='Medium'
            variant='Alert'>
            {translate('Action.Disable')}
          </Button>
          <Button isDisabled={isPending} onClick={onClose} size='Medium' variant='Standard'>
            {translate('Action.KeepOn')}
          </Button>
        </>
      }
      dialogTitle={translate('Heading.DisableAutoReload')}
    />
  );
};

export const openDisableAutoReloadConfirmDialog = (props: {
  autoReloadCampaigns: AutoReloadCampaign[];
  onConfirm: () => Promise<void>;
  workspace?: CreatorWorkspace;
}): void => {
  openDialog({
    component: DisableAutoReloadConfirmDialog,
    props,
  });
};

export default DisableAutoReloadConfirmDialog;

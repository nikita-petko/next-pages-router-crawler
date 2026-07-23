import { Fragment, useCallback, useMemo, useState } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation, useTranslation } from '@rbx/intl';
import { type TBannerProps } from '@rbx/ui';
import { useGetAllPassesForUniverse } from '@modules/passes/queries/useGetAllPassesForUniverse';
import { useBulkUpdateRegionalPricingForPasses } from '@modules/passes/queries/useBulkUpdateRegionalPricingForPasses';
import type { GamePassConfigV2 } from '@rbx/clients/gamePassesHttpService/v1';
import RegionalPricingDisclaimerModal, {
  useRegionalPricingDisclaimer,
} from '../RegionalPricingDisclaimerModal/RegionalPricingDisclaimerModal';
import { usePassesRegionalPricingPromotionBanner } from '../../hooks/useRegionalPricingPromotionBanner';
import BulkEnableRegionalPricingDialog from '../../dialogs/BulkEnableRegionalPricingDialog';
import {
  GeneralErrorDialog,
  PartialFailuresDialog,
  useErrorDialog,
} from '../../dialogs/UpdateErrorDialogs';
import BaseRegionalPricingPromotionBanner from './BaseRegionalPricingPromotionBanner';

type Props = {
  universeId: number;
  className?: string;
};

// We want to show all SELECTABLE passes that are eligible for regional pricing,
// inclusive of those that are already enabled for regional pricing.
function selectEligiblePassIds(passes: GamePassConfigV2[]): number[] {
  return passes
    .filter(
      (pass) =>
        pass.isForSale &&
        !pass.priceInformation?.enabledFeatures?.includes('PriceOptimization') &&
        !!pass.priceInformation?.defaultPriceInRobux,
    )
    .map((pass) => pass.gamePassId);
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

const GamePassesRegionalPricingPromotionBanner = ({ universeId, className }: Props) => {
  const { translate } = useTranslation();

  const { isOpen, close } = usePassesRegionalPricingPromotionBanner(universeId);

  const [isEnableRegionalPricingDialogOpen, setIsEnableRegionalPricingDialogOpen] =
    useState<boolean>(false);
  const handleCloseEnableRegionalPricingDialog = useCallback(() => {
    setIsEnableRegionalPricingDialogOpen(false);
  }, []);

  const { openErrorDialog, closeErrorDialog } = useErrorDialog();

  const {
    data: eligiblePassIds,
    isLoading: isLoadingPasses,
    isError: isErrorPasses,
  } = useGetAllPassesForUniverse(universeId, { select: selectEligiblePassIds });

  const { mutateAsync: bulkUpdate, isPending: isUpdatePending } =
    useBulkUpdateRegionalPricingForPasses(
      { universeId },
      {
        onSuccess: close,
        onSettled: handleCloseEnableRegionalPricingDialog,
        onPartialFailure: (errors, { passIds }) =>
          openErrorDialog(
            // Treat partial update errors for a single pass as general errors
            passIds.length > 1 ? (
              <PartialFailuresDialog count={errors.length} onClose={closeErrorDialog} />
            ) : (
              <GeneralErrorDialog onClose={closeErrorDialog} />
            ),
            { fullWidth: true },
          ),
        onError: () =>
          openErrorDialog(<GeneralErrorDialog onClose={closeErrorDialog} />, { fullWidth: true }),
      },
    );

  const handleEnableAllEligiblePasses = useCallback(async () => {
    if (eligiblePassIds === undefined) {
      openErrorDialog(<GeneralErrorDialog onClose={closeErrorDialog} />, { fullWidth: true });
      return;
    }

    // Do nothing if no eligible passes
    if (eligiblePassIds.length === 0) {
      setIsEnableRegionalPricingDialogOpen(false);
      return;
    }

    // Enable regional pricing for all eligible passes
    await bulkUpdate({ passIds: eligiblePassIds, enabled: true }).catch(() => {});
  }, [bulkUpdate, closeErrorDialog, eligiblePassIds, openErrorDialog]);

  const { withDisclaimer: withRegionalPricingDisclaimer } =
    useRegionalPricingDisclaimer(universeId);

  const handleClickEnableNow = useCallback(() => {
    withRegionalPricingDisclaimer(() => setIsEnableRegionalPricingDialogOpen(true));
  }, [withRegionalPricingDisclaimer]);

  const isLoading = isLoadingPasses || isUpdatePending;

  const primaryAction: TBannerProps['primary'] = useMemo(
    () => ({
      label: translate('Action.EnableNow'),
      onClick: handleClickEnableNow,
      disabled: isLoading,
      loading: isLoading,
    }),
    [translate, isLoading, handleClickEnableNow],
  );

  // Don't show the banner if we can't load passes
  if (isErrorPasses) {
    return null;
  }

  return (
    <Fragment>
      <BaseRegionalPricingPromotionBanner
        universeId={universeId}
        page='monetization/passes'
        primary={primaryAction}
        isOpen={isOpen}
        onClose={close}
        className={className}
      />

      <RegionalPricingDisclaimerModal universeId={universeId} />

      {eligiblePassIds && (
        <BulkEnableRegionalPricingDialog
          isOpen={isEnableRegionalPricingDialogOpen}
          onClose={handleCloseEnableRegionalPricingDialog}
          onConfirm={handleEnableAllEligiblePasses}
          disabled={isLoading}>
          {pluralize(
            eligiblePassIds.length,
            translate('Message.EnableSingleEligiblePassForRegionalPricing'),
            translate('Message.EnableMultipleEligiblePassesForRegionalPricing', {
              number: eligiblePassIds.length.toString(),
            }),
          )}
        </BulkEnableRegionalPricingDialog>
      )}
    </Fragment>
  );
};

export default withTranslation(GamePassesRegionalPricingPromotionBanner, [
  TranslationNamespace.Creations,
  TranslationNamespace.RegionalPricing,
]);

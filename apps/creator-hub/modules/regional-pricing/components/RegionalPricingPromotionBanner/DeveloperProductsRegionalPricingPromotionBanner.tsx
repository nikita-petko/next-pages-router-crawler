import { Fragment, useCallback, useMemo, useState } from 'react';
import { withTranslation, useTranslation } from '@rbx/intl';
import { type TBannerProps } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { BULK_UPDATE_LIMIT } from '@modules/developer-products/queries/constants';
import {
  useInfiniteListDeveloperProducts,
  type ListDeveloperProductsConfigsResponse,
} from '@modules/developer-products/queries/useInfiniteListDeveloperProducts';
import { isSelectableForRegionalPricing } from '@modules/developer-products/utils/developerProductUtils';
import { useBulkUpdateRegionalPricingForDeveloperProducts } from '@modules/developer-products/queries/useBulkUpdateRegionalPricingForDeveloperProducts';
import { useCountDeveloperProducts } from '@modules/developer-products/hooks/useCountDeveloperProducts';
import { useLoadInitialDeveloperProducts } from '@modules/developer-products/hooks/useLoadInitialDeveloperProducts';
import { useInfiniteFlatMap } from '@modules/monetization-shared/react-query';
import { useDeveloperProductsRegionalPricingPromotionBanner } from '../../hooks/useRegionalPricingPromotionBanner';
import DeveloperProductRegionalPricingDisclaimerModal, {
  useDeveloperProductRegionalPricingDisclaimer,
} from '../DeveloperProductRegionalPricingDisclaimerModal/DeveloperProductRegionalPricingDisclaimerModal';
import BulkEnableRegionalPricingDialog from '../../dialogs/BulkEnableRegionalPricingDialog';
import {
  GeneralErrorDialog,
  PartialFailuresDialog,
  TooManyProductsToUpdateDialog,
  useErrorDialog,
} from '../../dialogs/UpdateErrorDialogs';
import BaseRegionalPricingPromotionBanner from './BaseRegionalPricingPromotionBanner';

type Props = {
  universeId: number;
  className?: string;
};

const selectEligibleProductIds = (page: ListDeveloperProductsConfigsResponse): number[] => {
  return page.developerProducts
    .filter(isSelectableForRegionalPricing)
    .map((product) => product.productId);
};

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function DeveloperProductsRegionalPricingPromotionBanner({ universeId, className }: Props) {
  const { translate } = useTranslation();

  const { isOpen, close } = useDeveloperProductsRegionalPricingPromotionBanner(universeId);

  const { data: count = 0 } = useCountDeveloperProducts({ universeId });
  const exceedsLimit = count > BULK_UPDATE_LIMIT;

  const { isInitialLoading: isLoadingProducts, isInitialError: isErrorProducts } =
    useLoadInitialDeveloperProducts({ universeId });

  const flattenEligibleDeveloperProductIds = useInfiniteFlatMap(selectEligibleProductIds);

  const { data: eligibleProductIds } = useInfiniteListDeveloperProducts(
    { universeId },
    { enabled: !exceedsLimit, select: flattenEligibleDeveloperProductIds },
  );

  const [isEnableRegionalPricingDialogOpen, setIsEnableRegionalPricingDialogOpen] =
    useState<boolean>(false);
  const handleCloseEnableRegionalPricingDialog = useCallback(() => {
    setIsEnableRegionalPricingDialogOpen(false);
  }, []);

  const { openErrorDialog, closeErrorDialog } = useErrorDialog();

  const { mutateAsync: bulkUpdate, isPending: isUpdatePending } =
    useBulkUpdateRegionalPricingForDeveloperProducts(
      { universeId, totalLimit: BULK_UPDATE_LIMIT },
      {
        onSuccess: close,
        onSettled: handleCloseEnableRegionalPricingDialog,
        onPartialFailure: (errors, { productIds }) =>
          openErrorDialog(
            // Treat partial update errors for a single product as general errors
            productIds.length > 1 ? (
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

  const handleEnableAllEligibleProducts = useCallback(async () => {
    if (eligibleProductIds === undefined) {
      openErrorDialog(<GeneralErrorDialog onClose={closeErrorDialog} />, { fullWidth: true });
      return;
    }

    if (eligibleProductIds.length === 0) {
      return;
    }

    await bulkUpdate({ productIds: eligibleProductIds, enabled: true }).catch(() => {});
  }, [bulkUpdate, eligibleProductIds, openErrorDialog, closeErrorDialog]);

  const { withDisclaimer: withRegionalPricingDisclaimer } =
    useDeveloperProductRegionalPricingDisclaimer(universeId);

  const handleClickEnableNow = useCallback(() => {
    withRegionalPricingDisclaimer(async () => {
      if (exceedsLimit) {
        // Add slight delay for more fluid UX on this flow
        await new Promise((resolve) => setTimeout(resolve, 250));
        openErrorDialog(<TooManyProductsToUpdateDialog onClose={closeErrorDialog} />, {
          fullWidth: true,
        });
        return;
      }

      setIsEnableRegionalPricingDialogOpen(true);
    });
  }, [closeErrorDialog, exceedsLimit, openErrorDialog, withRegionalPricingDisclaimer]);

  const isLoading = isLoadingProducts || isUpdatePending;

  const primaryAction: TBannerProps['primary'] = useMemo(
    () => ({
      label: translate('Action.EnableNow'),
      onClick: handleClickEnableNow,
      disabled: isLoading,
      loading: isLoading,
    }),
    [translate, handleClickEnableNow, isLoading],
  );

  // Don't show the banner if we can't load products
  if (isErrorProducts) {
    return null;
  }

  return (
    <Fragment>
      <BaseRegionalPricingPromotionBanner
        universeId={universeId}
        page='monetization/developer-products'
        primary={primaryAction}
        isOpen={isOpen}
        onClose={close}
        className={className}
      />

      <DeveloperProductRegionalPricingDisclaimerModal
        universeId={universeId}
        page='/developer-products'
      />

      {eligibleProductIds && (
        <BulkEnableRegionalPricingDialog
          isOpen={isEnableRegionalPricingDialogOpen}
          onClose={handleCloseEnableRegionalPricingDialog}
          onConfirm={handleEnableAllEligibleProducts}
          disabled={isLoading}
          loading={isUpdatePending}>
          {pluralize(
            eligibleProductIds.length,
            translate('Message.EnableSingleProductForRegionalPricing'),
            translate('Message.EnableMultipleProductsForRegionalPricing', {
              count: eligibleProductIds.length.toString(),
            }),
          )}
        </BulkEnableRegionalPricingDialog>
      )}
    </Fragment>
  );
}

export default withTranslation(DeveloperProductsRegionalPricingPromotionBanner, [
  TranslationNamespace.Creations,
  TranslationNamespace.RegionalPricing,
]);

import { Button, Icon, Toggle } from '@rbx/foundation-ui';
import { Tooltip } from '@rbx/ui';
import { useRouter } from 'next/router';

import { openDisableAutoReloadConfirmDialog } from '@components/billing/dialogs/DisableAutoReloadConfirmDialog';
import Skeleton from '@components/common/Skeleton';
import { AdCreditBalanceScope, PaymentMethodActionEnum } from '@constants/billing';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { disableAutoReload } from '@services/ads/disableAutoReloadService';
import { usePaymentSettingsStore } from '@stores/paymentSettingsStoreProvider';
import { useToastStore } from '@stores/toastStoreProvider';
import {
  MicroUsdToUsdStringRoundedDown,
  MicroUsdToUsdStringRoundedUpNoDecimals,
} from '@utils/currency';

interface AdCreditBalanceProps {
  adCreditBalance: number;
  groupId?: number;
  heading?: string;
  isError?: boolean;
  isLoading?: boolean;
  onReloadBalanceClick?: () => void;
  reloadBalanceScope?: AdCreditBalanceScope;
  showAutoReloadSection?: boolean;
  showReloadButton?: boolean;
}

const AdCreditBalance = ({
  adCreditBalance,
  groupId,
  heading,
  isError = false,
  isLoading = false,
  onReloadBalanceClick,
  reloadBalanceScope,
  showAutoReloadSection = true,
  showReloadButton = true,
}: AdCreditBalanceProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);

  const router = useRouter();
  const handleClick = () => {
    if (onReloadBalanceClick) {
      onReloadBalanceClick();
      return;
    }
    router.push({
      pathname: Routes.ADD_PAYMENT,
      query: {
        action: PaymentMethodActionEnum.RELOAD_AD_CREDIT,
        ...(reloadBalanceScope ? { balanceScope: reloadBalanceScope } : {}),
      },
    });
  };

  const autoReloadState = usePaymentSettingsStore((state) =>
    groupId !== undefined ? state.groupAutoReloadDataByGroupId[groupId] : state.autoReloadData,
  );
  const autoReloadData = autoReloadState?.data;
  const isAutoReloadError = autoReloadState?.isError ?? false;
  const isAutoReloadLoading = autoReloadState?.isLoading ?? groupId !== undefined;
  const getAutoReloadData = usePaymentSettingsStore((state) => state.getAutoReloadData);

  const { setShowDisableAllAutoReloadError, setShowDisableAllAutoReloadSuccessful } =
    useToastStore();

  const hasAutoReloadCampaigns =
    !isAutoReloadError &&
    !isAutoReloadLoading &&
    Boolean(autoReloadData && autoReloadData.num_auto_reload_campaigns > 0);

  // The toggle and the "Disable all" button both trigger handleDisableAllClicked,
  // so they share a single disabled condition to stay in lockstep.
  const isAutoReloadActionDisabled =
    isAutoReloadLoading || isAutoReloadError || !hasAutoReloadCampaigns;

  const handleDisableAllClicked = () => {
    openDisableAutoReloadConfirmDialog(async () => {
      try {
        await disableAutoReload(groupId);
        getAutoReloadData(groupId);
        setShowDisableAllAutoReloadSuccessful(true);
      } catch (_error) {
        setShowDisableAllAutoReloadError(true);
      }
    });
  };

  // The toggle reflects whether any campaign currently has auto-reload enabled.
  // There is no bulk "enable" path (auto-reload is enabled per campaign), so the
  // only user-initiated transition is turning it off, which opens the same
  // confirmation flow as the "Disable all" button.
  const handleAutoReloadToggle = (isChecked: boolean) => {
    if (!isChecked) {
      handleDisableAllClicked();
    }
  };

  const autoReloadDescriptionContent = (() => {
    if (isAutoReloadLoading) {
      return (
        <Skeleton
          className='height-[1.2em] width-[240px]'
          data-testid='autoReloadDescriptionSkeleton'
        />
      );
    }

    if (isAutoReloadError) {
      return <span data-testid='autoReloadError'>{translate('Message.FailedToFetchData')}</span>;
    }

    if (hasAutoReloadCampaigns && autoReloadData) {
      return translate('Description.AutoReloadBalance', {
        amount: MicroUsdToUsdStringRoundedUpNoDecimals(autoReloadData.total_daily_reload_amount),
        numCampaigns: autoReloadData.num_auto_reload_campaigns.toString(),
      });
    }

    return translate('Description.AutoReloadBalanceNoCampaigns');
  })();

  return (
    <div
      className='flex grow-1 shrink-1 min-width-0 flex-col gap-xxlarge self-stretch'
      data-testid='adCreditBalanceContainer'>
      <div className='flex width-full items-start gap-xxlarge'>
        <div className='flex grow-1 shrink-1 min-width-0 flex-col gap-small'>
          <div className='flex flex-col gap-small'>
            <span className='text-title-large content-default' data-testid='currentBalanceHeader'>
              {heading ?? translate('Heading.AdCreditBalance')}
            </span>
            {isError ? (
              <span className='text-body-medium content-default' data-testid='balanceError'>
                {translate('Message.FailedToFetchData')}
              </span>
            ) : (
              <span className='text-heading-large content-emphasis' data-testid='balanceAmount'>
                {isLoading ? (
                  <Skeleton
                    className='height-[1.2em] width-[160px]'
                    data-testid='balanceAmountSkeleton'
                  />
                ) : (
                  MicroUsdToUsdStringRoundedDown(adCreditBalance)
                )}
              </span>
            )}
          </div>
          <p
            className='text-body-medium content-default'
            data-testid='refundUnusedAdCreditReminder'>
            {translate('Description.RealtimeAdCreditBillingDescription')}
          </p>
        </div>
        {showReloadButton ? (
          <Button
            className='shrink-0'
            data-testid='reloadBalanceButton'
            onClick={handleClick}
            size='Medium'
            variant='Standard'>
            {translate('Action.ReloadAdCreditBalance')}
          </Button>
        ) : null}
      </div>

      {showAutoReloadSection ? (
        <div
          className='flex width-full items-center gap-xxlarge wrap'
          data-testid='autoReloadContainer'>
          <div className='flex grow-1 shrink-1 min-width-0 flex-col gap-medium'>
            <div className='flex items-center gap-small'>
              <Toggle
                aria-label={translate('Heading.AutoReloadBalance')}
                isChecked={hasAutoReloadCampaigns}
                isDisabled={isAutoReloadActionDisabled}
                onCheckedChange={handleAutoReloadToggle}
                placement='Start'
                size='Medium'
              />
              <span className='text-body-medium content-emphasis'>
                {translate('Heading.AutoReloadBalance')}
              </span>
              <Tooltip
                arrow
                data-testid='balanceChargeReminderTooltip'
                placement='bottom'
                title={translate('Description.AutoReloadBalanceTooltip')}>
                <Icon className='content-default' name='icon-regular-circle-i' size='Small' />
              </Tooltip>
            </div>
            <p className='text-body-medium content-default'>{autoReloadDescriptionContent}</p>
          </div>
          <Button
            isDisabled={isAutoReloadActionDisabled}
            onClick={handleDisableAllClicked}
            size='Medium'
            variant='Alert'>
            {translate('Action.DisableAllAutoReload')}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default AdCreditBalance;

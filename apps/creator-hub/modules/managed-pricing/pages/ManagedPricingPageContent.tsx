/* istanbul ignore file */
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useGetHardCodedPricesSummary } from '@modules/hard-coded-prices/queries/useGetHardCodedPricesSummary';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import AccessDeniedPage from '@modules/miscellaneous/error/components/AccessDeniedPage';
import PageNotFound from '@modules/miscellaneous/error/components/PageNotFound';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { ProgressCircleLoader } from '@modules/monetization-shared/loaders';
import MultiFeedbackBanner, {
  type MultiFeedbackBannerItem,
} from '@modules/monetization-shared/multi-feedback-banner/MultiFeedbackBanner';
import GenericTabbedPageLayout, {
  type TabConfig,
} from '@modules/monetization-shared/tabs/GenericTabbedPageLayout';
import { useUniversePermissions } from '@modules/react-query/organizations';
import ManagedPricingPromotionBanner from '../banners/ManagedPricingPromotionBanner';
import { useHasSeenManagedPricing } from '../common/useHasSeenManagedPricing';
import { isManagedPricingAvailable } from '../hooks/useIsManagedPricingAvailable';
import ManageItemsTabContainer from '../manage-items/containers/ManageItemsTabContainer';
import OnboardingLandingContent from '../onboarding/components/OnboardingLandingContent';
import OverviewTabContainer from '../overview/containers/OverviewTabContainer';
import PricingActivityTabContainer from '../pricing-activity/containers/PricingActivityTabContainer';
import { useGetGiftingTradingStatus } from '../queries/useGetGiftingTradingStatus';
import { useGetManagedPricingStatus } from '../queries/useGetManagedPricingStatus';
import type { ManagedPricingTab } from '../types';

const getHardCodedPricesUrl = dashboard.getMonetizationHardCodedPricesUrl;

function ManagedPricingPageContent({ universeId }: { universeId: number }) {
  const router = useRouter();
  const { translate } = useTranslation();

  useHasSeenManagedPricing(universeId, { setOnMount: true });

  const {
    data: permissions,
    isLoading: isLoadingPermissions,
    isError: isErrorPermissions,
  } = useUniversePermissions(universeId);

  const {
    data: managedPricingStatus,
    isLoading: isLoadingManagedPricingStatus,
    isError: isErrorManagedPricingStatus,
  } = useGetManagedPricingStatus(universeId);

  const { data: giftingTradingStatus, isLoading: isLoadingGiftingTradingStatus } =
    useGetGiftingTradingStatus(universeId, {
      select: (data) => data.giftingTradingStatus,
    });

  const { data: isHardCodedPricesDetected, isLoading: isLoadingHardCodedPrices } =
    useGetHardCodedPricesSummary({ universeId }, { select: (data) => data.hasViolations });

  const isLoading =
    isLoadingManagedPricingStatus ||
    isLoadingPermissions ||
    isLoadingGiftingTradingStatus ||
    isLoadingHardCodedPrices;
  if (isLoading) {
    return <ProgressCircleLoader />;
  }

  const isError = isErrorManagedPricingStatus || isErrorPermissions;
  if (isError) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={router.reload}
      />
    );
  }

  const hasPermission =
    permissions?.monetizeExperience === true || permissions?.viewAnalytics === true;
  if (permissions !== undefined && !hasPermission) {
    return <AccessDeniedPage />;
  }

  if (!isManagedPricingAvailable(managedPricingStatus?.status)) {
    return <PageNotFound />;
  }

  if (managedPricingStatus?.status === 'Pending') {
    return (
      <OnboardingLandingContent
        universeId={universeId}
        className='margin-bottom-large medium:margin-top-medium'
      />
    );
  }

  const hasRegionalPricingSource = managedPricingStatus?.sources?.includes('RegionalPricing');

  const tabs: TabConfig<ManagedPricingTab>[] = [
    {
      key: 'overview' satisfies ManagedPricingTab,
      label: translate('Heading.Overview'),
      content: (
        <OverviewTabContainer universeId={universeId} giftingTradingStatus={giftingTradingStatus} />
      ),
    },
    {
      key: 'pricing-activity' satisfies ManagedPricingTab,
      label: translate('Heading.PricingActivity'),
      content: <PricingActivityTabContainer universeId={universeId} />,
    },
    {
      key: 'manage-items' satisfies ManagedPricingTab,
      label: translate('Heading.ManageItems'),
      content: (
        <ManageItemsTabContainer
          universeId={universeId}
          giftingTradingStatus={giftingTradingStatus}
        />
      ),
    },
  ];

  const warningBannerItems: MultiFeedbackBannerItem[] = [];

  if (isHardCodedPricesDetected) {
    warningBannerItems.push({
      title: translate('Heading.HardCodedPricesDetected' /* TranslationNamespace.ManagedPricing */),
      description: translate(
        'Description.HardCodedPricesDetected' /* TranslationNamespace.ManagedPricing */,
      ),
      actionProps: {
        as: 'a',
        href: getHardCodedPricesUrl(universeId),
        children: translate('Action.ViewReport' /* TranslationNamespace.ManagedPricing */),
      },
    });
  }

  return (
    <div className='flex flex-col gap-xxlarge margin-bottom-large'>
      <ManagedPricingPromotionBanner
        universeId={universeId}
        page='managed-pricing/overview'
        fromRegionalPricing={hasRegionalPricingSource}
      />

      {warningBannerItems.length > 0 && (
        <MultiFeedbackBanner severity='Warning' variant='Emphasis' items={warningBannerItems} />
      )}

      <GenericTabbedPageLayout tabs={tabs} defaultTab='overview' />
    </div>
  );
}

export default withTranslation(ManagedPricingPageContent, [
  TranslationNamespace.Error,
  TranslationNamespace.Creations,
  TranslationNamespace.ManagedPricing,
]);

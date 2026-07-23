/* istanbul ignore file */
import { useRouter } from 'next/router';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useUniversePermissions } from '@modules/react-query/organizations';
import { PageLoading } from '@modules/miscellaneous/common';
import { ErrorPage, PageNotFound } from '@modules/miscellaneous/error';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import GenericTabbedPageLayout, {
  type TabConfig,
} from '@modules/monetization-shared/tabs/GenericTabbedPageLayout';
import MultiFeedbackBanner from '@modules/monetization-shared/multi-feedback-banner/MultiFeedbackBanner';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import { useGetManagedPricingStatus } from '../queries/useGetManagedPricingStatus';
import OverviewTabContainer from '../containers/OverviewTabContainer';
import PricingActivityTabContainer from '../containers/PricingActivityTabContainer';
import ManageItemsTabContainer from '../containers/ManageItemsTabContainer';
import type { ManagedPricingTab } from '../types';

const getHardCodedPricesUrl = dashboard.getManagedPricingHardCodedPricesUrl;

function ManagedPricingPageContent({ universeId }: { universeId: number }) {
  const router = useRouter();
  const { translate } = useTranslation();

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

  const isLoading = isLoadingManagedPricingStatus || isLoadingPermissions;
  if (isLoading) {
    return <PageLoading />;
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

  const hasPermission = permissions?.monetizeExperience || permissions?.viewAnalytics;
  if (hasPermission === false) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  const isManagedPricingEligible =
    managedPricingStatus?.status === 'Pending' || managedPricingStatus?.status === 'Accepted';
  if (!isManagedPricingEligible) {
    return <PageNotFound />;
  }

  const tabs: TabConfig<ManagedPricingTab>[] = [
    {
      key: 'overview' satisfies ManagedPricingTab,
      label: translate('Heading.Overview'),
      content: <OverviewTabContainer universeId={universeId} />,
    },
    {
      key: 'pricing-activity' satisfies ManagedPricingTab,
      label: translate('Heading.PricingActivity'),
      content: <PricingActivityTabContainer universeId={universeId} />,
    },
    {
      key: 'manage-items' satisfies ManagedPricingTab,
      label: translate('Heading.ManageItems'),
      content: <ManageItemsTabContainer universeId={universeId} />,
    },
  ];

  const hardCodedPricesLink = getHardCodedPricesUrl(universeId);

  return (
    <div className='flex flex-col gap-xxlarge margin-bottom-medium'>
      {/* TODO: Banners and alerts slot */}
      <MultiFeedbackBanner
        // DEMO: hard-coding this for now
        severity='Warning'
        variant='Emphasis'
        items={[
          {
            title: "We've detected items with hard-coded prices",
            description:
              'Hard-coded prices cannot be optimized. View these items to update these prices.',
            actionProps: { as: 'a', href: hardCodedPricesLink, children: 'View report' },
          },
        ]}
      />

      <GenericTabbedPageLayout tabs={tabs} defaultTab='overview' />
    </div>
  );
}

export default withTranslation(ManagedPricingPageContent, [
  TranslationNamespace.Error,
  TranslationNamespace.Creations,
  TranslationNamespace.ManagedPricing,
]);

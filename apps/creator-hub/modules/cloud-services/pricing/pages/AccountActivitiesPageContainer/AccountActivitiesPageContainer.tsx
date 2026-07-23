import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { HubMeta, buildBreadcrumb, buildTitle } from '@rbx/creator-hub-history';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Divider, Grid, Tab, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import type { CreatorType } from '@modules/miscellaneous/common';
import { EmptyGrid } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import HorizontalTabs from '@modules/miscellaneous/components/HorizontalTabs';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { parseOverrideId, getCreatorTypeAndId } from '../../../utils/common';
import { useCloudPricingClient } from '../../CloudPricingClientProvider';
import AccountActivity from '../../components/AccountActivity/AccountActivity';
import { useAccountActivityFilter } from '../../components/AccountActivityProvider/AccountActivityProvider';
import AccountStatusAlert from '../../components/AccountStatusAlert/AccountStatusAlert';
import BillingBalance from '../../components/BillingBalance/BillingBalance';
import type { ActivityRowInfo, BalanceInfo, BillDetails } from '../../types';
import { ResponseAccountState } from '../../types';
import useAccountActivitiesPageContainerStyles from './AccountActivitiesPageContainer.styles';

enum BillingTabs {
  CloudServices = 'CloudServices',
  // Placeholder for billings other than cloud service
}

const AccountActivitiesPageContainer: FunctionComponent = () => {
  const router = useRouter();
  const { userIdOverride, groupIdOverride } = router.query;
  const { reload: routerReload, isReady: isRouterReady } = useRouter();
  const [{ activeTab }, setQueryParamValues] = useQueryParams(['activeTab']);
  const { translate } = useTranslationWrapper(useTranslation());
  const currentGroup = useCurrentGroup();
  const { user } = useAuthentication();
  const cloudPricingClient = useCloudPricingClient();
  const { startMonth, endMonth } = useAccountActivityFilter();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPageInitFailed, setIsPageInitFailed] = useState<boolean>(false);
  const [balanceData, setBalanceData] = useState<BalanceInfo | null>(null);
  const [activityData, setActivityData] = useState<ActivityRowInfo[] | null>(null);
  const [latestBill, setLatestBill] = useState<BillDetails | null>(null);
  const [dollarHoldLoading, setDollarHoldLoading] = useState<boolean>(false);
  const [displayMissingPaymentAlert, setDisplayMissingPaymentAlert] = useState<boolean>(false);

  const {
    classes: { overlay, disabledOverlay, loader, loaderDescription },
    cx,
  } = useAccountActivitiesPageContainerStyles();

  const activeBillingTab = useMemo(() => {
    if (!Object.values(BillingTabs).includes(activeTab as BillingTabs)) {
      return BillingTabs.CloudServices;
    }
    return activeTab as BillingTabs;
  }, [activeTab]);

  const handleTabChange = useCallback(
    async (value: unknown) => {
      setQueryParamValues({ activeTab: (value as BillingTabs).toString() });
    },
    [setQueryParamValues],
  );

  const { creatorType, creatorId, userId } = useMemo(() => {
    return getCreatorTypeAndId(currentGroup, user);
  }, [currentGroup, user]);

  const userOverride = parseOverrideId(userIdOverride);
  const groupOverride = parseOverrideId(groupIdOverride);

  const loadPageData = useCallback(
    async (type: CreatorType, id: number, startMonthString: string, endMonthString: string) => {
      setIsLoading(true);
      try {
        const paymentInfo = await cloudPricingClient.getPaymentProfiles(
          type,
          id,
          userOverride,
          groupOverride,
        );

        if (!paymentInfo || paymentInfo === null) {
          setDisplayMissingPaymentAlert(true);
        }

        const { balanceInfo, activityInfo } = await cloudPricingClient.getAccountActivity(
          type,
          id,
          userOverride,
          groupOverride,
          startMonthString,
          endMonthString,
        );

        // If our account has not been in normal, we may not have the correct activity data
        // In this case, we should fetch the latest bill to get the correct bill for manual payment
        if (balanceInfo.accountState !== ResponseAccountState.Normal) {
          try {
            const billDetails = await cloudPricingClient.getBillingInfo(
              id,
              type,
              undefined,
              true,
              userOverride,
              groupOverride,
            );
            setLatestBill(billDetails);
          } catch {
            // If we cannot find the latest bill and the account has been suspended we can assume that the
            // account is missing some type of Eligibility requirement or does not have a valid payment method.
            // Display the page as normal
            setLatestBill(null);
          }
        }
        setBalanceData(balanceInfo);
        setActivityData(activityInfo);
        setIsPageInitFailed(false);
      } catch {
        setIsPageInitFailed(true);
      } finally {
        setIsLoading(false);
      }
    },
    [cloudPricingClient, userOverride, groupOverride],
  );

  useEffect(() => {
    if (creatorType && creatorId) {
      loadPageData(creatorType, creatorId, startMonth, endMonth);
    } else {
      setIsPageInitFailed(true);
    }
  }, [
    creatorType,
    creatorId,
    startMonth,
    endMonth,
    userIdOverride,
    dollarHoldLoading,
    loadPageData,
  ]);

  if (isRouterReady && !isLoading && isPageInitFailed) {
    return (
      <FailureView
        title={translate(translationKey('Heading.FailedToLoadPage', TranslationNamespace.Error))}
        message={translate(translationKey('Message.FailedToLoadPage', TranslationNamespace.Error))}
        buttonText={translate(
          translationKey('Action.FailedToLoadPage', TranslationNamespace.Error),
        )}
        onReload={() => routerReload()}
      />
    );
  }

  if (activityData && balanceData && creatorType && creatorId && userId) {
    return (
      <Grid container XSmall={12} spacing={3}>
        <HubMeta
          title={buildTitle(
            translate(translationKey('Heading.Billing', TranslationNamespace.CloudServices)),
          )}
          breadcrumb={buildBreadcrumb(
            translate(translationKey('Heading.Finances', TranslationNamespace.Navigation)),
            translate(translationKey('Heading.Billing', TranslationNamespace.CloudServices)),
          )}
        />
        {dollarHoldLoading && (
          <div className={cx(overlay, disabledOverlay)}>
            <Grid
              alignItems='center'
              justifyContent='center'
              flexDirection='column'
              display='flex'
              className={loader}>
              <CircularProgress />
              <Grid className={loaderDescription}>
                <Typography variant='body2'>
                  {translate(
                    translationKey('Heading.DollarHoldLoad', TranslationNamespace.CloudServices),
                  )}
                </Typography>
              </Grid>
            </Grid>
          </div>
        )}
        <Grid item XSmall={12}>
          <HorizontalTabs value={activeBillingTab} onChange={handleTabChange}>
            {Object.values(BillingTabs).map((type) => (
              <Tab
                label={translate(
                  translationKey(`Label.${type}`, TranslationNamespace.CloudServices),
                )}
                value={type}
                key={type}
              />
            ))}
          </HorizontalTabs>
          <Divider />
        </Grid>
        <Grid item XSmall={12} XLarge={12}>
          <AccountStatusAlert
            accountState={balanceData.accountState}
            latestBill={latestBill}
            creatorType={creatorType}
            creatorId={creatorId}
            displayMissingPaymentAlert={displayMissingPaymentAlert}
          />
        </Grid>
        <Grid container item XSmall={12}>
          {activeBillingTab === BillingTabs.CloudServices && (
            <>
              <Grid item XSmall={12}>
                <BillingBalance
                  creatorType={creatorType}
                  id={creatorId}
                  userId={userId}
                  balanceInfo={balanceData}
                  userIdOverride={userOverride}
                  groupIdOverride={groupOverride}
                  setLoading={setDollarHoldLoading}
                  displayMissingPaymentAlert={setDisplayMissingPaymentAlert}
                />
              </Grid>
              <Grid item XSmall={12}>
                <AccountActivity data={activityData} isLoading={isLoading} />
              </Grid>
            </>
          )}
        </Grid>
      </Grid>
    );
  }

  return (
    <EmptyGrid>
      <CircularProgress />
    </EmptyGrid>
  );
};

export default withTranslation(AccountActivitiesPageContainer, [
  TranslationNamespace.Table,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.CloudServices,
  TranslationNamespace.Navigation,
]);

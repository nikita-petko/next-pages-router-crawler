import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import getResponseFromError from '@modules/clients/utils/getResponseFromError';
import type { CreatorType } from '@modules/miscellaneous/common';
import { EmptyGrid } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import PageNotFound from '@modules/miscellaneous/error/components/PageNotFound';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import {
  parseOverrideId,
  getCreatorTypeAndId,
  isValidBillingDateString,
} from '../../../utils/common';
import { useCloudPricingClient } from '../../CloudPricingClientProvider';
import BillingStatement, {
  isTStatementInfo,
} from '../../components/BillingStatement/BillingStatement';
import type { BillDetails } from '../../types';

const validBillingStatementQueries = ['pending'];

const BillingStatementPageContainer: FunctionComponent = () => {
  const router = useRouter();
  const { translate } = useTranslationWrapper(useTranslation());
  const { query: routerQuery, isReady: isRouterReady, reload: routerReload } = useRouter();
  const currentGroup = useCurrentGroup();
  const { user: currentUser } = useAuthentication();
  const cloudPricingClient = useCloudPricingClient();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDataFetchFailed, setIsDataFetchFailed] = useState<boolean>(false);
  const [billingData, setBillingData] = useState<BillDetails | null>(null);
  const [isBillingDateNotFound, setIsBillingDateNotFound] = useState<boolean>(false);
  const { userIdOverride, groupIdOverride } = router.query;

  const statementInfo = useMemo(() => {
    if (isRouterReady) {
      const { date } = routerQuery;
      if (typeof date === 'string') {
        if (validBillingStatementQueries.includes(date)) {
          return { isPendingUsage: true, billingDate: undefined };
        }
        if (isValidBillingDateString(date)) {
          return { isPendingUsage: false, billingDate: new Date(date) };
        }
      }
    }
    return { isPendingUsage: false, billingDate: undefined };
  }, [isRouterReady, routerQuery]);

  const { creatorType, creatorId } = useMemo(() => {
    return getCreatorTypeAndId(currentGroup, currentUser);
  }, [currentGroup, currentUser]);

  const userOverride = parseOverrideId(userIdOverride);
  const groupOverride = parseOverrideId(groupIdOverride);
  const loadPageData = useCallback(
    async (type: CreatorType, id: number, date?: Date) => {
      try {
        setIsLoading(true);
        setIsDataFetchFailed(false);
        setIsBillingDateNotFound(false);
        const res = await cloudPricingClient.getBillingInfo(
          id,
          type,
          date,
          undefined,
          userOverride,
          groupOverride,
        );
        setBillingData(res);
      } catch (e) {
        const error = getResponseFromError(e);
        if (error?.status === StatusCodes.NOT_FOUND) {
          setIsBillingDateNotFound(true);
        }
        setIsDataFetchFailed(true);
      } finally {
        setIsLoading(false);
      }
    },
    [cloudPricingClient, userOverride, groupOverride],
  );

  useEffect(() => {
    if (creatorType && creatorId) {
      loadPageData(creatorType, creatorId, statementInfo.billingDate);
    } else {
      setIsDataFetchFailed(true);
    }
  }, [creatorType, creatorId, statementInfo.billingDate, userIdOverride, loadPageData]);

  if (
    (isRouterReady && !statementInfo.isPendingUsage && !statementInfo.billingDate) ||
    (!isLoading && isBillingDateNotFound)
  ) {
    return <PageNotFound />;
  }

  if (!isLoading && isDataFetchFailed) {
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

  if (billingData && isTStatementInfo(statementInfo)) {
    return <BillingStatement data={billingData} statementInfo={statementInfo} />;
  }

  return (
    <EmptyGrid>
      <CircularProgress />
    </EmptyGrid>
  );
};

export default withTranslation(BillingStatementPageContainer, [TranslationNamespace.Error]);

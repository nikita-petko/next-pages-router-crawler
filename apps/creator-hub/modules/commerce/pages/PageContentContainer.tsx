import { useTranslation } from '@rbx/intl';
import React, { FunctionComponent } from 'react';
import { useRouter } from 'next/router';
import { CircularProgress } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/common';
import CommerceIneligibleView from '../components/CommerceIneligibleView';
import useCommerce from '../hooks/useCommerce';
import { CommercePathname } from '../hooks/useCommerceNavigation';
import isBaselineEligible from '../utils/isBaselineEligible';

const PageContentContainer: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  const { ready: translationReady } = useTranslation();
  const { isLoadingPermissions, isShopifyEnabled, isAmazonEnabled, eligibilityStatus } =
    useCommerce();

  if (isLoadingPermissions || eligibilityStatus === undefined || !translationReady) {
    return (
      <EmptyGrid>
        <CircularProgress color='secondary' />
      </EmptyGrid>
    );
  }

  if (
    !(isAmazonEnabled || isShopifyEnabled) &&
    !eligibilityStatus.baselineEligibility.hasEligibleModerationHistory
  ) {
    return <CommerceIneligibleView />;
  }

  const isEligible =
    isAmazonEnabled ||
    isShopifyEnabled ||
    isBaselineEligible(eligibilityStatus?.baselineEligibility);

  if (!isEligible && router.pathname !== CommercePathname.Commerce) {
    return <CommerceIneligibleView />;
  }

  return children;
};

export default PageContentContainer;

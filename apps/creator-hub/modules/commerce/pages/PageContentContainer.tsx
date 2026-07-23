import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/components';
import CommerceIneligibleView from '../components/CommerceIneligibleView';
import useCommerce from '../hooks/useCommerce';
import { CommercePathname } from '../hooks/useCommerceNavigation';
import isBaselineEligible from '../utils/isBaselineEligible';

const PageContentContainer = ({ children }: React.PropsWithChildren) => {
  const router = useRouter();
  const { ready: translationReady } = useTranslation();
  const { isLoadingPermissions, isShopifyEnabled, eligibilityStatus } = useCommerce();

  if (isLoadingPermissions || eligibilityStatus === undefined || !translationReady) {
    return (
      <EmptyGrid>
        <CircularProgress color='secondary' />
      </EmptyGrid>
    );
  }

  if (!isShopifyEnabled && !eligibilityStatus.baselineEligibility.hasEligibleModerationHistory) {
    return <CommerceIneligibleView />;
  }

  const isEligible = isShopifyEnabled || isBaselineEligible(eligibilityStatus?.baselineEligibility);

  const commercePathname: string = CommercePathname.Commerce;
  if (!isEligible && router.pathname !== commercePathname) {
    return <CommerceIneligibleView />;
  }

  return children;
};

export default PageContentContainer;

import { Button } from '@rbx/foundation-ui';
import { useRouter } from 'next/router';
import { memo, useCallback } from 'react';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import GenericNoDataPage from '@components/common/GenericNoDataPage';
import useManageAdsEducationStyles from '@components/onboarding/ManageAdsEducation.styles';
import PromotionBanner from '@components/reporting/PromotionBanner';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useAdAccountAutoCreateCreateAction from '@hooks/account/useAdAccountAutoCreateCreateAction';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useAppStore } from '@stores/appStoreProvider';

// TODO: Jira https://roblox.atlassian.net/browse/ADS-8685 Swap out to use IconComponentType when image asset is available rbx/ui
const AdsIcon = ({ className }: { className: string }) => (
  <img
    alt='ads-icon'
    className={className}
    src={`${process.env.assetPathPrefix}/common/ads_dark.png`}
  />
);

const ManageAdsEducation = memo(() => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);
  const router = useRouter();
  const { advertisingShouldBeEnabled } = useAppStore((state) => state.advertisingShouldBeEnabled());

  const {
    classes: { outerContainer },
  } = useManageAdsEducationStyles();

  const primaryButtonClick = useAdAccountAutoCreateCreateAction(() => {
    logNativeClickEvent(EventName.CreateCampaignButtonInEducationClicked);
    router.push(Routes.NEW_CREATE_CAMPAIGN);
  }, 'manageAdsEducation');

  const secondaryButtonClick = useCallback(() => {
    window.open(
      'https://create.roblox.com/docs/production/promotion/ads-manager#manage-ads-new',
      '_blank',
    );
  }, []);

  return (
    <div className={outerContainer}>
      <PromotionBanner />
      <GenericNoDataPage
        CustomIconComponent={AdsIcon}
        outlined
        primaryButton={
          <Button
            isDisabled={!advertisingShouldBeEnabled}
            onClick={primaryButtonClick}
            size='Large'
            variant='Emphasis'>
            {translate('Action.CreateCampaignButton')}
          </Button>
        }
        secondaryButton={
          <Button onClick={secondaryButtonClick} size='Large' variant='Standard'>
            {translate('Action.LearnMoreManage')}
          </Button>
        }
        subtitle={translate('Description.GrowExperienceSubtitle')}
        title={translate('Heading.GrowExperienceWithAds')}
      />
    </div>
  );
});

export default ManageAdsEducation;

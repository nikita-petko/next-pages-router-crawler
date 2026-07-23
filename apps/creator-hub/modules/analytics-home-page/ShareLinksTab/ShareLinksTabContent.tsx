import Link from 'next/link';
import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import { withTranslation, useTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';
import AffiliateProgramBanner from '@modules/affiliate-program/components/AffiliateProgramBanner';
import AnalyticsTabContentLayout from '@modules/experience-analytics-shared/layout/AnalyticsTabContentLayout';
import { Flex } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import CreatorRewardsShareLinksAnalytics from './CreatorRewardsShareLinksAnalytics';

const ShareLinksTabContent: FunctionComponent = () => {
  const { translate } = useTranslation();
  const { query } = useRouter();

  return (
    <AnalyticsTabContentLayout controls={[]}>
      <AffiliateProgramBanner style={{ marginBottom: '24px' }} />
      <Flex>
        <Button
          variant='contained'
          color='secondary'
          size='large'
          component={Link}
          href={dashboard.getUrl(
            query.groupId ? `${query.groupId}` : undefined,
            undefined,
            'ShareLink',
          )}>
          {translate('Label.ViewShareLinksV2')}
        </Button>
      </Flex>
      <CreatorRewardsShareLinksAnalytics />
    </AnalyticsTabContentLayout>
  );
};

export default withTranslation(ShareLinksTabContent, [
  TranslationNamespace.ShareLinkAnalytics,
  TranslationNamespace.Analytics,
]);

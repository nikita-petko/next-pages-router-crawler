import React, { FunctionComponent } from 'react';
import { withTranslation, useTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';
import { AnalyticsTabContentLayout } from '@modules/experience-analytics-shared';
import { components } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import AffiliateProgramBanner from '@modules/affiliate-program/components/AffiliateProgramBanner';
import CreatorRewardsShareLinksAnalytics from './CreatorRewardsShareLinksAnalytics';

const { Flex } = components;

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

import React from 'react';
import { Grid, NavigateBeforeIcon, Typography } from '@rbx/ui';
import CreatorDashboardLink from '@modules/miscellaneous/common/components/CreatorDashboardLink';
import { useRouter } from 'next/router';
import { urls } from '@modules/miscellaneous/common';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import useBillingStatementLeftNavigationStyles from './BillingStatementLeftNavigation.styles';

const BillingStatementLeftNavigation = () => {
  const router = useRouter();
  const { query } = router;

  const {
    classes: { backSection, navigateIcon },
  } = useBillingStatementLeftNavigationStyles();
  const { translate } = useTranslationWrapper(useTranslation());

  return (
    <CreatorDashboardLink
      tabIndex={0}
      href={{
        pathname: urls.creatorHub.dashboard.getServiceActivityUrl(),
        query: {
          ...(query.groupId ? { groupId: query.groupId } : {}),
        },
      }}
      underline='none'
      color='inherit'>
      <Grid container alignItems='center' wrap='nowrap' className={backSection}>
        <NavigateBeforeIcon className={navigateIcon} />
        <Typography variant='buttonSmall'>
          {translate(translationKey('Action.BackToBilling', TranslationNamespace.CloudServices))}
        </Typography>
      </Grid>
    </CreatorDashboardLink>
  );
};
export default withTranslation(BillingStatementLeftNavigation, [
  TranslationNamespace.CloudServices,
]);

import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, NavigateBeforeIcon, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import CreatorDashboardLink from '@modules/miscellaneous/components/CreatorDashboardLink';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { creatorHub } from '@modules/miscellaneous/urls';
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
        pathname: creatorHub.dashboard.getServiceActivityUrl(),
        query: query.groupId ? { groupId: query.groupId } : {},
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

import NextLink from 'next/link';
import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React from 'react';
import { AccountStatusEnum } from '@rbx/client-rights/v1';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, Grid, Link, Typography, ArrowForwardIcon } from '@rbx/ui';
import { EmptyState, PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ErrorType from '../../enums/ErrorType';
import useCheckAge from '../../hooks/useCheckAge';
import useCurrentAccount from '../../hooks/useCurrentAccount';
import { CLAIMS_HREF, REGISTRATION_HREF, REMOVAL_REQUESTS_HREF } from '../../urls';
import RightsApiErrorView, { getErrorType } from '../error/RightsApiErrorView';
import RightsManagerU13 from './RightsManagerU13';

/**
 * RightsManagementContainer is the main landing page.
 */
const RightsManagementContainer: FunctionComponent<{
  /**
   * Don't redirect shadow accounts, but let them see the registration page.
   */
  allowShadowAccounts?: boolean;
}> = ({ allowShadowAccounts }) => {
  const router = useRouter();
  const { ready, translate } = useTranslation();

  const { success: isLegalAge, error: checkAgeError, isPending: checkAgeLoading } = useCheckAge();
  const checkAgeErrorType = getErrorType(checkAgeError);

  const { isPending, error: currentAccountError, account, features } = useCurrentAccount();
  const currentAccountErrorType = getErrorType(currentAccountError);

  if (isPending || checkAgeLoading || !ready) {
    return <PageLoading />;
  }

  // Handle U13 check
  if (checkAgeError && checkAgeErrorType !== ErrorType.None) {
    return <RightsApiErrorView errorResponse={checkAgeError} handleReload={router.reload} />;
  }

  if (!isLegalAge) {
    return <RightsManagerU13 />;
  }

  // allow no account
  if (currentAccountError && currentAccountErrorType !== ErrorType.NotFound) {
    return <RightsApiErrorView errorType={currentAccountErrorType} />;
  }

  if (
    !isPending &&
    !currentAccountError &&
    account.id &&
    (!allowShadowAccounts || account.status !== AccountStatusEnum.Unverified)
  ) {
    // If already have an account, redirect
    if (features?.enableClaimsAndDisputes) {
      router.push(CLAIMS_HREF);
    } else {
      router.push(REMOVAL_REQUESTS_HREF);
    }
    return null;
  }
  // Show landing page if no account

  return (
    <Grid container direction='column' height='100%'>
      <EmptyState
        title={translate('Heading.RegisterIPH')}
        description={
          <>
            <Typography variant='body1'>{translate('Description.IPHRegistration')}</Typography>
            {/* Otherwise link is split into two lines. Re-evaluate as translation changes. */}
            <br />
            <Link
              target='_blank'
              href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/publishing/dmca-guidelines`}>
              {translate('Label.LearnMore')}
            </Link>
            <br />
            <br />
            <Typography>{translate('Description.RegisterAsOwner')}</Typography>
          </>
        }
        size='large'
        illustration='rightsManager'>
        <NextLink href={REGISTRATION_HREF} passHref legacyBehavior>
          <Button color='primaryBrand' variant='contained' endIcon={<ArrowForwardIcon />}>
            {translate('Label.StartRegistration')}
          </Button>
        </NextLink>
      </EmptyState>
    </Grid>
  );
};

export default withTranslation(RightsManagementContainer, [
  TranslationNamespace.RightsPortal,
  TranslationNamespace.AgreementsManager,
]);

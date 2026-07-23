import React, { useCallback, useMemo } from 'react';
import { useIXPParameters, useQueryParams } from '@modules/miscellaneous/hooks';
import { AccountStatusEnum } from '@rbx/clients/rightsV1/v1';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography, Link as MuiLink, Tabs, Tab } from '@rbx/ui';
import Link from 'next/link';
import { PageLoading } from '@modules/miscellaneous/common';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import AccountHeader from '../removalRequests/AccountHeader';
import OnboardingModal from '../removalRequests/OnboardingModal';
import ClaimsByMeContainer from './ClaimsByMeContainer';
import ClaimsAgainstMeContainer from './ClaimsAgainstMeContainer';

export const ClaimsURL = '/dashboard/rights-manager/claims';

export enum ListClaimsTabs {
  ByMe = 'ByMe',
  AgainstMe = 'AgainstMe',
}

/**
 *  ClaimsContainer contains two tabs. Either listing claims by you, or claims against you.
 */
const ClaimsContainer = () => {
  const { ready, translate, translateHTML } = useTranslation();
  const { account, features } = useCurrentAccountContext();
  // only verified accounts can see ClaimsByMe
  const isVerified = account && account.status === AccountStatusEnum.Verified;
  const {
    isFetched: isIXPFetched,
    params: { enableClaimsAgainstMe },
  } = useIXPParameters(IXPLayers.RightsManager);

  const [{ activeTab }, setQueryParams] = useQueryParams(['activeTab']);
  const activeClaimsTab: ListClaimsTabs = useMemo(() => {
    if (!Object.values(ListClaimsTabs).includes(activeTab as ListClaimsTabs)) {
      return isVerified ? ListClaimsTabs.ByMe : ListClaimsTabs.AgainstMe;
    }
    return activeTab as ListClaimsTabs;
  }, [activeTab, isVerified]);
  const handleTabChange = useCallback(
    (_: React.SyntheticEvent<Element, Event>, value: ListClaimsTabs) => {
      setQueryParams({ activeTab: (value as ListClaimsTabs).toString() });
    },
    [setQueryParams],
  );

  const labelForTab = (tab: ListClaimsTabs) => {
    switch (tab) {
      case ListClaimsTabs.ByMe:
        return translate('Label.MyClaims');
      case ListClaimsTabs.AgainstMe:
        return translate('Label.ClaimsAgainstMe');
      default:
        return '';
    }
  };

  const tabs = isVerified
    ? [ListClaimsTabs.ByMe, ListClaimsTabs.AgainstMe]
    : [ListClaimsTabs.AgainstMe];

  let claimContents = null;
  if (isVerified) {
    // only load claims for verified accounts
    claimContents = <ClaimsByMeContainer account={account} />;
  }

  const displayingByMe = activeClaimsTab === ListClaimsTabs.ByMe;

  if (!account || !ready || !isIXPFetched) {
    return <PageLoading />;
  }

  if (!features?.enableClaimsAndDisputes && !enableClaimsAgainstMe) {
    return null;
  }

  return (
    <Grid container direction='column' spacing={3}>
      <AccountHeader account={account} />
      <Grid item container spacing={2} direction='column'>
        <Grid item>
          <Typography variant='body1' color='secondary'>
            {translateHTML('Description.Claims', [
              {
                opening: 'guidelinesStart',
                closing: 'guidelinesEnd',
                content(chunks) {
                  return (
                    <Link
                      href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/publishing/rights-manager`}
                      passHref
                      legacyBehavior>
                      <MuiLink color='primary'>{chunks}</MuiLink>
                    </Link>
                  );
                },
              },
              {
                opening: 'faqStart',
                closing: 'faqEnd',
                content(chunks) {
                  return (
                    <Link
                      href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/publishing/dmca-guidelines`}
                      passHref
                      legacyBehavior>
                      <MuiLink color='primary'>{chunks}</MuiLink>
                    </Link>
                  );
                },
              },
            ])}
          </Typography>
        </Grid>
      </Grid>
      <Grid item>
        <Tabs
          value={activeClaimsTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', marginTop: '0px' }}>
          {tabs.map((curTab) => (
            <Tab key={curTab} label={labelForTab(curTab)} value={curTab} />
          ))}
        </Tabs>
      </Grid>
      <Grid item display={displayingByMe ? '' : 'none'}>
        {claimContents}
      </Grid>
      <Grid item display={displayingByMe ? 'none' : ''}>
        <ClaimsAgainstMeContainer account={account} />
      </Grid>
      {isVerified && <OnboardingModal />}
    </Grid>
  );
};

export default withTranslation(ClaimsContainer, [TranslationNamespace.RightsPortal]);

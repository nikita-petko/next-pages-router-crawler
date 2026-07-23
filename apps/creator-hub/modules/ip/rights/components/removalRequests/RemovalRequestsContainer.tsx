import Link from 'next/link';
import React, { useCallback, useMemo } from 'react';
import { AccountStatusEnum } from '@rbx/client-rights/v1';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography, Link as MuiLink, Tab, Tabs } from '@rbx/ui';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { PageLoading } from '@modules/miscellaneous/components';
import { useIXPParameters, useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { usePaginatedIpFamiliesQuery } from '../../../ipFamilies/hooks/ipFamily';
import { ACCOUNT_HREF } from '../../urls';
import ClaimsAgainstMeContainer from '../claims/ClaimsAgainstMeContainer';
import AccountHeader from './AccountHeader';
import AdvancedToolingAlert from './AdvancedToolingAlert';
import RemovalRequests from './RemovalRequests';

export enum ListRemovalRequestsTabs {
  MyRemovalRequests = 'MyRemovalRequests',
  ClaimsAgainstMe = 'ClaimsAgainstMe',
}

/**
 *  RemovalRequestsContainer displays removal requests & claims against me for an account
 */
const RemovalRequestsContainer = () => {
  const { ready, translate, translateHTML } = useTranslation();
  const { account } = useCurrentAccountContext();
  const {
    isFetched: isIXPFetched,
    params: { enableClaimsAgainstMe },
  } = useIXPParameters(IXPLayers.RightsManager, { restoreInitialValueFromCache: true });

  const { data: ipFamiliesData } = usePaginatedIpFamiliesQuery({
    pageSize: 1,
  });

  const isVerified = account && account.status === AccountStatusEnum.Verified;

  const [{ activeTab }, setQueryParams] = useQueryParams(['activeTab']);
  const handleTabChange = useCallback(
    (_: React.SyntheticEvent<Element>, value: ListRemovalRequestsTabs) => {
      setQueryParams({ activeTab: value.toString() });
    },
    [setQueryParams],
  );
  const labelForTab = (tab: ListRemovalRequestsTabs) => {
    switch (tab) {
      case ListRemovalRequestsTabs.MyRemovalRequests:
        return translate('Heading.MyRemovalRequests');
      case ListRemovalRequestsTabs.ClaimsAgainstMe:
        return translate('Label.ClaimsAgainstMe');
      default:
        return '';
    }
  };
  const tabs: ListRemovalRequestsTabs[] = [];
  // show claims against me tab for all users when claims are enabled for anyone.
  if (isVerified) {
    tabs.push(ListRemovalRequestsTabs.MyRemovalRequests);
  }
  if (enableClaimsAgainstMe) {
    tabs.push(ListRemovalRequestsTabs.ClaimsAgainstMe);
  }

  let removalRequestContents = null;
  if (isVerified) {
    // only load removal requests for verified accounts
    removalRequestContents = (
      <RemovalRequests accountId={account.id ?? ''} accountStatus={account.status ?? ''} />
    );
  }
  let claimsAgainstMeContents = null;
  if (account && enableClaimsAgainstMe) {
    claimsAgainstMeContents = <ClaimsAgainstMeContainer account={account} />;
  }

  const activeShadowTab: ListRemovalRequestsTabs = useMemo(() => {
    if (!Object.values(ListRemovalRequestsTabs).includes(activeTab as ListRemovalRequestsTabs)) {
      return isVerified
        ? ListRemovalRequestsTabs.MyRemovalRequests
        : ListRemovalRequestsTabs.ClaimsAgainstMe;
    }
    return activeTab as ListRemovalRequestsTabs;
  }, [activeTab, isVerified]);

  const displayingRemovalRequests = activeShadowTab === ListRemovalRequestsTabs.MyRemovalRequests;

  if (!account || !ready || !isIXPFetched) {
    return <PageLoading />;
  }

  const ipFamilies = ipFamiliesData?.ipFamilies || [];
  const showAdvancedToolingAlert =
    account.status === AccountStatusEnum.Verified && ipFamilies.length === 0;

  return (
    <Grid container direction='column' spacing={3}>
      <AccountHeader account={account} />
      {showAdvancedToolingAlert && <AdvancedToolingAlert />}
      <Grid item container spacing={2} direction='column'>
        <Grid item paddingBottom={3}>
          <Typography variant='body1' color='secondary'>
            {translateHTML('Label.RegistrationDetails', [
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
              {
                opening: 'accountLinkStart',
                closing: 'accountLinkEnd',
                content(chunks) {
                  return (
                    <Link href={ACCOUNT_HREF} passHref legacyBehavior>
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
          value={activeShadowTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', marginTop: '0px' }}
          hidden={tabs.length === 0}>
          {tabs.map((curTab) => (
            <Tab key={curTab} label={labelForTab(curTab)} value={curTab} />
          ))}
        </Tabs>
      </Grid>
      <Grid item display={displayingRemovalRequests ? '' : 'none'}>
        {removalRequestContents}
      </Grid>
      <Grid item display={displayingRemovalRequests ? 'none' : ''}>
        {claimsAgainstMeContents}
      </Grid>
    </Grid>
  );
};

export default withTranslation(RemovalRequestsContainer, [TranslationNamespace.RightsPortal]);

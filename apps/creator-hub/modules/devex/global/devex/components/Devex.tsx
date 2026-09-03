import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation, useLocalization } from '@rbx/intl';
import { Link, Grid, Typography, List, ListItem, ListItemIcon, CheckIcon, Alert } from '@rbx/ui';
import type { GetDevExInfoResponse } from '@modules/clients/economy';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import {
  getDevexTermsURL,
  getDevexInfoURL,
  getRobloxTermsURL,
  // DEVEX_UPDATES_URL,
} from '../../constants/externalLinkConstants';
import { useTaxDocumentationAccess } from '../../taxes/hooks/useTaxDocumentationAccess';
import { useGetTaxOnboardingStatus } from '../../taxes/queries/useGetTaxOnboardingStatus';
import { resolveTaxDocumentationStatusVariant } from '../../taxes/utils/taxDocumentationStatus';
import { isDevExSuspended } from '../utils/devexEligibility';
import CashOutBox from './CashOutBox';
import useDevexStyles from './Devex.styles';
import DevExTaxDocumentationBanner from './DevExTaxDocumentationBanner';
import RequestStatusMessage from './RequestStatusMessage';

interface DevexProps {
  cashoutInfo: GetDevExInfoResponse;
  userRobux?: number;
  onCashoutClick: () => void;
}

const Devex: FunctionComponent<React.PropsWithChildren<DevexProps>> = ({
  cashoutInfo,
  userRobux,
  onCashoutClick,
}) => {
  const {
    classes: { root, cashOutBoxContainer, marginBottom, bulletListIcon, bulletListItem },
  } = useDevexStyles();

  const { translate, translateHTML } = useTranslation();
  const { locale } = useLocalization();
  const { isFetched: isIXPFetched, params: ixpParams } = useIXPParameters(
    IXPLayers.CreatorDashboard,
  );

  const { isFetched, settings } = useSettings();
  const { canAccessTaxDocumentation } = useTaxDocumentationAccess();
  const { data: taxOnboardingStatus } = useGetTaxOnboardingStatus({
    enabled: canAccessTaxDocumentation,
  });
  const taxDocumentationStatusVariant = resolveTaxDocumentationStatusVariant(
    taxOnboardingStatus?.onboardingStatus,
  );
  const taxDocumentationBannerVariant =
    taxDocumentationStatusVariant === 'notStarted' ||
    taxDocumentationStatusVariant === 'curingRequired' ||
    taxDocumentationStatusVariant === 'failed'
      ? taxDocumentationStatusVariant
      : undefined;
  const shouldShowTaxDocumentationBanner =
    canAccessTaxDocumentation &&
    taxOnboardingStatus?.onboardingStatus !== undefined &&
    taxDocumentationBannerVariant !== undefined;

  return (
    <Grid className={root} container spacing={2}>
      {shouldShowTaxDocumentationBanner && (
        <Grid item>
          <DevExTaxDocumentationBanner statusVariant={taxDocumentationBannerVariant} />
        </Grid>
      )}
      {/* NOTE (jcountryman, 04/24/2024): Requested by the team to comment out instead of removing in setting deletion exercise */}
      {/* <Grid item>
        <Alert severity='info' variant='standard'>
          {translateHTML(
            'Message.CashOutBannerUpdate',
            [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content(chunks) {
                  return (
                    <Link href={DEVEX_UPDATES_URL} target='_blank'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ],
            { lineBreak: <br /> },
          )}
        </Alert>
      </Grid> */}
      {isFetched && settings.enableDevexMaintenanceBanner && (
        <Grid item>
          <Alert severity='info' variant='standard'>
            {translate('Message.DevexMaintenance')}
          </Alert>
        </Grid>
      )}
      {!isDevExSuspended(cashoutInfo) && (
        <RequestStatusMessage
          lastImbursementStatus={cashoutInfo.lastImbursementStatus}
          lastImbursementSubmissionDate={cashoutInfo.lastImbursementSubmissionDate}
        />
      )}
      <Grid item className={cashOutBoxContainer}>
        <CashOutBox
          userRobux={userRobux}
          cashoutInfo={cashoutInfo}
          onCashoutClick={onCashoutClick}
        />
        {isIXPFetched && ixpParams?.enableDevexEarnedRobux && (
          <Typography color='secondary' component='p' variant='caption'>
            {translate('Description.EarnedFundsAsterisk')}
          </Typography>
        )}
      </Grid>
      <Grid item className={marginBottom}>
        <Typography color='secondary' component='p' variant='body1'>
          {translateHTML(
            isIXPFetched && ixpParams?.enableDevexEarnedRobux
              ? 'Description.DevExInfoV2'
              : 'Description.DevExInfo',
            null,
            {
              lineBreak: <br />,
              minCashoutValue: cashoutInfo.minRobuxToCashOut?.toLocaleString() ?? 'Undefined',
            },
          )}
        </Typography>
      </Grid>
      <Grid item>
        <Typography color='secondary' component='p' variant='body1'>
          {translate('Description.TermsAndRequirements')}
        </Typography>
      </Grid>
      <Grid item>
        <List>
          <ListItem className={bulletListItem}>
            <ListItemIcon className={bulletListIcon}>
              <CheckIcon fontSize='small' />
            </ListItemIcon>
            <Typography color='secondary' variant='body1'>
              {translate('Label.BalanceRequirementV2', {
                minCashoutValue: cashoutInfo.minRobuxToCashOut?.toLocaleString() ?? 'Undefined',
              })}
            </Typography>
          </ListItem>
          <ListItem className={bulletListItem}>
            <ListItemIcon className={bulletListIcon}>
              <CheckIcon fontSize='small' />
            </ListItemIcon>
            <Typography color='secondary' variant='body1'>
              {translate('Label.Email2FARequirement')}
            </Typography>
          </ListItem>
          <ListItem className={bulletListItem}>
            <ListItemIcon className={bulletListIcon}>
              <CheckIcon fontSize='small' />
            </ListItemIcon>
            <Typography color='secondary' variant='body1'>
              {translate('Label.DevExPortalRequirement')}
            </Typography>
          </ListItem>
          <ListItem className={bulletListItem}>
            <ListItemIcon className={bulletListIcon}>
              <CheckIcon fontSize='small' />
            </ListItemIcon>
            <Typography color='secondary' variant='body1'>
              {translate('Label.AgeRequirementV2', { minAge: '13' })}
            </Typography>
          </ListItem>
          <ListItem className={bulletListItem}>
            <ListItemIcon className={bulletListIcon}>
              <CheckIcon fontSize='small' />
            </ListItemIcon>
            <Typography color='secondary' variant='body1'>
              {translateHTML('Label.CommunityRequirement', [
                {
                  opening: 'TOSLinkStart',
                  closing: 'TOSLinkEnd',
                  content(chunks) {
                    return (
                      <Link href={getRobloxTermsURL(locale)} target='_blank'>
                        {chunks}
                      </Link>
                    );
                  },
                },
              ])}
            </Typography>
          </ListItem>
        </List>
      </Grid>
      <Grid item className={marginBottom}>
        <Typography color='secondary' component='p' variant='body1'>
          {translate('Description.CashOutProcess')}
        </Typography>
      </Grid>
      <Grid item className={marginBottom}>
        <Link href={getDevexInfoURL(locale)} target='_blank'>
          <Typography color='inherit' variant='body1'>
            {translate('Label.MoreInfo')}
          </Typography>
        </Link>
      </Grid>
      <Grid item className={marginBottom}>
        <Link href={getDevexTermsURL(locale)} target='_blank'>
          <Typography color='inherit' variant='body1'>
            {translate('Label.TermsOfService')}
          </Typography>
        </Link>
      </Grid>
    </Grid>
  );
};

export default Devex;

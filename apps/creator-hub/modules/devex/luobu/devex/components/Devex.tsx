import React, { FunctionComponent, useEffect, useState } from 'react';
import billingClient, {
  LuobuDevexEligibilityEnum as Eligibility,
  LuobuDevexRequestStatusEnum as RequestStatus,
} from '@modules/clients/billing';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Link,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
  useMediaQuery,
} from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { externalLinks } from '@modules/navigation/footer/constants/externalLinkConstants';
import CashOutBox from './CashOutBox';
import RequestStatusMessage from './RequestStatusMessage';
import { minBalance, minAge } from '../constants/requirements';

import useDevexStyles from './Devex.styles';

const Devex: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const {
    classes: { root, noPadding, bulletListItem },
  } = useDevexStyles();

  const { translate } = useTranslation();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const [balance, setBalance] = useState(0);
  const [eligibility, setEligibility] = useState<Eligibility>(Eligibility.Unknown);
  const [latestRequestStatus, setLatestRequestStatus] = useState<RequestStatus>(RequestStatus.None);
  const [latestRequestDate, setLatestRequestDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      const [balanceResponse, eligibilityResponse, requestStatusResponse] = await Promise.all([
        billingClient.LuobuDevexAPI.v1LuobuDeveloperExchangeBalanceGet(),
        billingClient.LuobuDevexAPI.v1LuobuDeveloperExchangeEligibilityGet(),
        billingClient.LuobuDevexAPI.v1LuobuDeveloperExchangeLatestRequestStatusGet(),
      ] as const);

      if (balanceResponse.amount) {
        setBalance(Math.floor(balanceResponse.amount));
      }

      if (eligibilityResponse.eligibility) {
        setEligibility(eligibilityResponse.eligibility);
      }

      if (requestStatusResponse.status && requestStatusResponse.date) {
        setLatestRequestStatus(requestStatusResponse.status);
        setLatestRequestDate(requestStatusResponse.date);
      }
    };

    fetchData();
  }, []);

  return (
    <Grid className={root} container direction='column' spacing={2}>
      <Grid item>
        <Typography variant={isCompactView ? 'h2' : 'h1'} component='h1'>
          {translate('Heading.DevEx')}
        </Typography>
      </Grid>
      {latestRequestStatus !== RequestStatus.None &&
        latestRequestStatus !== RequestStatus.Unknown && (
          <Grid item>
            <RequestStatusMessage status={latestRequestStatus} date={latestRequestDate} />
          </Grid>
        )}
      <Grid item>
        <CashOutBox balance={balance} eligibility={eligibility} />
      </Grid>
      <Grid item>
        <List className={noPadding}>
          <ListItem className={bulletListItem}>
            <ListItemText disableTypography>
              <Typography color='secondary'>
                {/* FIXME: Hard coded currency symbol */}
                {translate('Label.BalanceRequirement', { amount: `¥${minBalance}` })}
              </Typography>
            </ListItemText>
          </ListItem>
          <ListItem className={bulletListItem}>
            <ListItemText disableTypography>
              <Typography color='secondary'>
                {translate('Label.AgeRequirement', { minAge: String(minAge) })}
              </Typography>
            </ListItemText>
          </ListItem>
          <ListItem className={bulletListItem}>
            <ListItemText disableTypography>
              <Typography color='secondary'>{translate('Label.TimeRequirement')}</Typography>
            </ListItemText>
          </ListItem>
        </List>
      </Grid>
      <Grid item>
        <Divider variant='fullWidth' />
      </Grid>
      <Grid item>
        <Typography color='secondary' component='p'>
          {translate('Description.CashOutProcess')}
        </Typography>
      </Grid>
      <Grid item>
        <Link href={externalLinks.devexPolicyURL} target='_blank' color='primary'>
          {translate('Label.TermsOfService')}
        </Link>
      </Grid>
    </Grid>
  );
};

export default withTranslation(Devex, [TranslationNamespace.DevEx]);

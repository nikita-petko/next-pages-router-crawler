import React, { FunctionComponent } from 'react';
import {
  InfoOutlinedIcon,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Grid,
  Tooltip,
  Typography,
  makeStyles,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { Link, PageLoading } from '@modules/miscellaneous/common';
import { getDurationRangeLabel } from '@modules/ip/license-manager/utils/timeLimitedLicense';
import { getMaturityRatingLabel } from '@modules/ip/license-manager/utils/maturityRating';
import { LicenseDurationType, LicenseResponse } from '@rbx/clients/contentLicensingApi/v1';
import { useSettings } from '@modules/settings';
import { useRobloxAuthentication } from '@rbx/auth';

import { LICENSE_APPLY_HREF } from '../urls';
import { formatRoyaltyRate } from '../utils/format';
import { getIsNonZeroRevShareFromLicense } from '../utils/revShare';

const useStyles = makeStyles()((theme) => ({
  tooltipContainer: {
    alignItems: 'center',
    marginTop: -5, // counteracts added visual padding from tooltip
  },
  tooltip: {
    paddingTop: 5, // needed to actually center tooltip with text
    paddingLeft: 5,
  },
  icon: {
    color: theme.palette.content.muted,
  },
}));

interface LicenseAccordionProps {
  license: LicenseResponse;
  isExpanded: boolean;
  onAccordionChange: (
    licenseId: string,
  ) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
  onViewDetails: (license: LicenseResponse) => () => void;
}

const LicenseAccordion: FunctionComponent<LicenseAccordionProps> = ({
  license,
  isExpanded,
  onAccordionChange,
  onViewDetails,
}) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;
  const { status, login } = useRobloxAuthentication();

  const isAuthenticated = status === 'success';

  // Unauthenticated users: accordion still expands/collapses normally
  const handleChange = onAccordionChange(license.id!);

  if (!isFetched) {
    return <PageLoading />;
  }

  return (
    <Accordion variant='outlined' expanded={isExpanded} onChange={handleChange}>
      <AccordionSummary>
        <Grid container flexDirection='column'>
          <Grid item>
            <Typography variant='h5' noWrap>
              {license.name}
            </Typography>
          </Grid>
          {!isExpanded && (
            <Grid item container flex-direction='row' spacing={1}>
              {isAuthenticated && license.royaltyRate !== undefined && (
                <React.Fragment>
                  <Grid item>
                    <Typography variant='body1' color='secondary'>
                      {translate('Label.RevenueShareRate', {
                        royaltyRate: formatRoyaltyRate(license.royaltyRate),
                      })}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant='body1' color='secondary'>
                      •
                    </Typography>
                  </Grid>
                </React.Fragment>
              )}
              <Grid item>
                <Typography variant='body1' color='secondary'>
                  {translate('Label.LicenseTypeFullExperienceLicense')}
                </Typography>
              </Grid>
              {enableIpPlatformTimeboundLicenses && isAuthenticated && (
                <React.Fragment>
                  <Grid item>
                    <Typography variant='body1' color='secondary'>
                      •
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant='body1' color='secondary'>
                      {license.licenseDuration?.durationType === LicenseDurationType.Perpetual
                        ? translate('Label.Perpetual')
                        : translate('Label.TimeLimited')}
                    </Typography>
                  </Grid>
                </React.Fragment>
              )}
            </Grid>
          )}
        </Grid>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container flexDirection='column'>
          <Grid item container marginBottom={2} columnGap={10} rowGap={1}>
            {/* Revenue share — only show when authenticated (royaltyRate is stripped for public) */}
            {isAuthenticated && (
              <Grid item container flexDirection='column' width='auto'>
                <Grid item>
                  <Typography variant='h2'>{formatRoyaltyRate(license.royaltyRate)}</Typography>
                </Grid>
                <Grid item container className={classes.tooltipContainer}>
                  <Grid item>
                    <Typography variant='body1' color='secondary'>
                      {translate('Label.RevenueShare')}
                    </Typography>
                  </Grid>
                  <Grid item className={classes.tooltip}>
                    <Tooltip
                      arrow
                      placement='right'
                      title={translate('Label.TooltipGrossRevShare')}>
                      <InfoOutlinedIcon fontSize='medium' className={classes.icon} />
                    </Tooltip>
                  </Grid>
                </Grid>
              </Grid>
            )}
            {/* Revenue share timing — only show when authenticated and non-zero rev share */}
            {isAuthenticated && getIsNonZeroRevShareFromLicense(license) && (
              <Grid item container flexDirection='column' width='auto'>
                <Grid item>
                  <Typography variant='h2'>
                    {translate(
                      license.enableMonetization
                        ? 'Label.RevShareOnActivation'
                        : 'Label.RevShareLater',
                    )}
                  </Typography>
                </Grid>
                <Grid item container className={classes.tooltipContainer}>
                  <Grid item>
                    <Typography variant='body1' display='block' color='secondary'>
                      {translate('Label.RevShareTiming')}
                    </Typography>
                  </Grid>
                  <Grid item className={classes.tooltip}>
                    <Tooltip
                      arrow
                      placement='right'
                      title={translate('Label.TooltipRevShareTiming')}>
                      <InfoOutlinedIcon fontSize='medium' className={classes.icon} />
                    </Tooltip>
                  </Grid>
                </Grid>
              </Grid>
            )}
            {/* License type — always visible */}
            <Grid item container flexDirection='column' width='auto'>
              <Grid item>
                <Typography variant='h2'>{translate('Label.LicenseTypeFullExperience')}</Typography>
              </Grid>
              <Grid item container className={classes.tooltipContainer}>
                <Grid item>
                  <Typography variant='body1' display='block' color='secondary'>
                    {translate('Label.LicenseType')}
                  </Typography>
                </Grid>
                <Grid item className={classes.tooltip}>
                  <Tooltip
                    arrow
                    placement='right'
                    title={translate('Label.TooltipFullExperienceLicense')}>
                    <InfoOutlinedIcon fontSize='medium' className={classes.icon} />
                  </Tooltip>
                </Grid>
              </Grid>
            </Grid>
            {enableIpPlatformTimeboundLicenses && (
              <Grid item container flexDirection='column' width='auto'>
                <Grid item>
                  <Typography variant='h2'>
                    {getDurationRangeLabel(translate, license.licenseDuration)}
                  </Typography>
                </Grid>
                <Grid item container className={classes.tooltipContainer}>
                  <Grid item>
                    <Typography variant='body1' display='block' color='secondary'>
                      {translate('Label.LicenseDuration')}
                    </Typography>
                  </Grid>
                  <Grid item className={classes.tooltip}>
                    <Tooltip
                      arrow
                      placement='right'
                      title={
                        license.licenseDuration?.durationType === LicenseDurationType.Perpetual
                          ? translate('Tooltip.LicenseDurationPerpetual')
                          : translate('Tooltip.LicenseDurationTimeLimited')
                      }>
                      <InfoOutlinedIcon
                        fontSize='medium'
                        className={classes.icon}
                        data-testid='duration-info-icon'
                      />
                    </Tooltip>
                  </Grid>
                </Grid>
              </Grid>
            )}
            {/* Max maturity rating — always visible (returned in both public and authenticated responses) */}
            <Grid item container flexDirection='column' width='auto'>
              <Grid item>
                <Typography variant='h2'>
                  {translate(getMaturityRatingLabel(license.maxAgeRating))}
                </Typography>
              </Grid>
              <Grid item container className={classes.tooltipContainer}>
                <Grid item>
                  <Typography variant='body1' display='block' color='secondary'>
                    {translate('Label.MaxMaturityRating')}
                  </Typography>
                </Grid>
                <Grid item className={classes.tooltip}>
                  <Tooltip
                    arrow
                    placement='right'
                    title={translate('Label.TooltipMaxMaturityRating')}>
                    <InfoOutlinedIcon
                      fontSize='medium'
                      className={classes.icon}
                      data-testid='max-maturity-info-icon'
                    />
                  </Tooltip>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid item marginBottom={2}>
            <Typography variant='body2' color='secondary' whiteSpace='pre-wrap'>
              {license.description}
            </Typography>
          </Grid>
          <Grid item container spacing={1}>
            <React.Fragment>
              <Grid item>
                <Button
                  variant='contained'
                  size='medium'
                  color='secondary'
                  onClick={isAuthenticated ? onViewDetails(license) : () => login()}>
                  {translate('Button.ViewDetails')}
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant='contained'
                  size='medium'
                  color='primaryBrand'
                  data-testid={`explore-license-request-button-${license.id!}`}
                  {...(isAuthenticated
                    ? { component: Link, href: LICENSE_APPLY_HREF(license.listingId!, license.id!) }
                    : { onClick: () => login() })}>
                  {translate('Button.RequestLicense')}
                </Button>
              </Grid>
            </React.Fragment>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default LicenseAccordion;

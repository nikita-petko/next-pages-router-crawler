import type { FunctionComponent } from 'react';
import React from 'react';
import { useRobloxAuthentication } from '@rbx/auth';
import type { LicenseResponse } from '@rbx/client-content-licensing-api/v1';
import { LicenseDurationType } from '@rbx/client-content-licensing-api/v1';
import { useTranslation } from '@rbx/intl';
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
import { getMaturityRatingLabel } from '@modules/ip/license-manager/utils/maturityRating';
import { getDurationRangeLabel } from '@modules/ip/license-manager/utils/timeLimitedLicense';
import { Link, PageLoading } from '@modules/miscellaneous/components';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import { LICENSE_APPLY_HREF } from '../urls';
import { formatRoyaltyRate } from '../utils/format';
import { getLicenseTypeTranslationKeys } from '../utils/licenseTypeTranslationKeys';
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
  const { isFetched } = useSettings();
  const { frontendFlags, loadingFrontendFlags } = useToolboxServiceApiProvider();
  const { status, login } = useRobloxAuthentication();

  const isAuthenticated = status === 'success';
  const enableCollaborationLicensing =
    frontendFlags[FrontendFlagName.FrontendFlagEnableCreatorCollaborationLicensing] ?? false;

  if (!license.id) {
    return null;
  }

  const licenseId = license.id;
  const listingId = license.listingId;

  // Unauthenticated users: accordion still expands/collapses normally
  const handleChange = onAccordionChange(licenseId);

  if (!isFetched || loadingFrontendFlags) {
    return <PageLoading />;
  }

  const licenseTypeLabels = getLicenseTypeTranslationKeys(license.licenseType);
  const showRevShareInSummary = isAuthenticated && license.royaltyRate !== undefined;
  const showDurationInSummary = isAuthenticated;

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
              {showRevShareInSummary && (
                <>
                  <Grid item>
                    <Typography variant='body1' color='secondary'>
                      {translate('Label.RevenueShareRate', {
                        royaltyRate: formatRoyaltyRate(license.royaltyRate),
                      })}
                    </Typography>
                  </Grid>
                  {(enableCollaborationLicensing || showDurationInSummary) && (
                    <Grid item>
                      <Typography variant='body1' color='secondary'>
                        •
                      </Typography>
                    </Grid>
                  )}
                </>
              )}
              {enableCollaborationLicensing && (
                <Grid item>
                  <Typography variant='body1' color='secondary'>
                    {translate(licenseTypeLabels.summary)}
                  </Typography>
                </Grid>
              )}
              {showDurationInSummary && (
                <>
                  {enableCollaborationLicensing && (
                    <Grid item>
                      <Typography variant='body1' color='secondary'>
                        •
                      </Typography>
                    </Grid>
                  )}
                  <Grid item>
                    <Typography variant='body1' color='secondary'>
                      {license.licenseDuration?.durationType === LicenseDurationType.TimeLimited
                        ? translate('Label.TimeLimited')
                        : translate('Label.Perpetual')}
                    </Typography>
                  </Grid>
                </>
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
            {enableCollaborationLicensing && (
              <Grid item container flexDirection='column' width='auto'>
                <Grid item>
                  <Typography variant='h2'>{translate(licenseTypeLabels.detail)}</Typography>
                </Grid>
                <Grid item container className={classes.tooltipContainer}>
                  <Grid item>
                    <Typography variant='body1' display='block' color='secondary'>
                      {translate('Label.LicenseType')}
                    </Typography>
                  </Grid>
                  <Grid item className={classes.tooltip}>
                    <Tooltip arrow placement='right' title={translate(licenseTypeLabels.tooltip)}>
                      <InfoOutlinedIcon fontSize='medium' className={classes.icon} />
                    </Tooltip>
                  </Grid>
                </Grid>
              </Grid>
            )}
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
            <>
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
                  data-testid={`explore-license-request-button-${licenseId}`}
                  {...(isAuthenticated && listingId
                    ? { component: Link, href: LICENSE_APPLY_HREF(listingId, licenseId) }
                    : { onClick: () => login() })}>
                  {translate('Button.RequestLicense')}
                </Button>
              </Grid>
            </>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default LicenseAccordion;

import { FunctionComponent } from 'react';
import {
  Button,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Tooltip,
  makeStyles,
  InfoOutlinedIcon,
} from '@rbx/ui';
import { Link, PageLoading } from '@modules/miscellaneous/common';
import { useTranslation } from '@rbx/intl';
import AmDivider from '@modules/ip/license-manager/components/AmDivider';
import LinkButton from '@modules/ip/components/LinkButton';
import { getDauLicenseLabelFromEnum } from '@modules/ip/license-manager/utils/dauEnum';
import { getMaturityRatingLabel } from '@modules/ip/license-manager/utils/maturityRating';
import {
  useLicenseManagerLogger,
  LicenseManagerClickEvent,
} from '@modules/ip/license-manager/utils/logger';
import { getDurationRangeLabel } from '@modules/ip/license-manager/utils/timeLimitedLicense';
import { useSettings } from '@modules/settings';

import {
  DauBucket,
  LicenseDurationType,
  LicenseResponse,
} from '@rbx/clients/contentLicensingApi/v1';
import { LICENSE_APPLY_HREF } from '../urls';
import { formatRoyaltyRate } from '../utils/format';
import { getIsNonZeroRevShareFromValue } from '../utils/revShare';

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

interface LicenseDetailsModalProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  license: LicenseResponse | null;
  handleGuidelinesAndRestrictionsClick?: () => void;
}

/** A popup modal that provides additional details about the license's rev share, content standards, etc. */
const LicenseDetailsModal: FunctionComponent<LicenseDetailsModalProps> = ({
  isOpen,
  setOpen,
  license,
  handleGuidelinesAndRestrictionsClick,
}) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const { logEvent } = useLicenseManagerLogger();
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;

  if (!license) {
    return null;
  }

  if (!isFetched) {
    return <PageLoading />;
  }

  return (
    <Dialog fullWidth maxWidth='Large' open={isOpen} onClose={() => setOpen(false)}>
      <DialogTitle>
        <Grid container paddingLeft={1.5} paddingRight={1.5} paddingTop={1.5}>
          <Typography variant='h4'>{license.name}</Typography>
        </Grid>
      </DialogTitle>
      <DialogContent>
        <Grid container flexDirection='column' spacing={1.5} padding={1.5}>
          <Grid item container columnGap={10} rowGap={1} flexDirection='row'>
            <Grid item container flexDirection='column' width='auto'>
              <Grid item>
                <Typography variant='h5'>{formatRoyaltyRate(license.royaltyRate)}</Typography>
              </Grid>
              <Grid item container className={classes.tooltipContainer}>
                <Grid item>
                  <Typography variant='body1' display='block' color='secondary'>
                    {translate('Label.RevenueShare')}
                  </Typography>
                </Grid>
                <Grid item className={classes.tooltip}>
                  <Tooltip arrow placement='top' title={translate('Label.TooltipGrossRevShare')}>
                    <InfoOutlinedIcon fontSize='small' className={classes.icon} />
                  </Tooltip>
                </Grid>
              </Grid>
            </Grid>
            {getIsNonZeroRevShareFromValue(license.royaltyRate) && (
              <Grid item container flexDirection='column' width='auto'>
                <Grid item>
                  <Typography variant='h5'>
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
                    <Tooltip arrow placement='top' title={translate('Label.TooltipRevShareTiming')}>
                      <InfoOutlinedIcon fontSize='small' className={classes.icon} />
                    </Tooltip>
                  </Grid>
                </Grid>
              </Grid>
            )}
            <Grid item container flexDirection='column' width='auto'>
              <Grid item XSmall>
                <Typography variant='h5'>{translate('Label.LicenseTypeFullExperience')}</Typography>
              </Grid>
              <Grid item container XSmall className={classes.tooltipContainer}>
                <Grid item>
                  <Typography variant='body1' display='block' color='secondary'>
                    {translate('Label.LicenseType')}
                  </Typography>
                </Grid>
                <Grid item className={classes.tooltip}>
                  <Tooltip
                    arrow
                    placement='top'
                    title={translate('Label.TooltipFullExperienceLicense')}>
                    <InfoOutlinedIcon fontSize='small' className={classes.icon} />
                  </Tooltip>
                </Grid>
              </Grid>
            </Grid>
            {enableIpPlatformTimeboundLicenses && (
              <Grid item container flexDirection='column' width='auto'>
                <Grid item XSmall>
                  <Typography variant='h5'>
                    {getDurationRangeLabel(translate, license.licenseDuration)}
                  </Typography>
                </Grid>
                <Grid item container XSmall className={classes.tooltipContainer}>
                  <Grid item>
                    <Typography variant='body1' display='block' color='secondary'>
                      {translate('Label.LicenseDuration')}
                    </Typography>
                  </Grid>
                  <Grid item className={classes.tooltip}>
                    <Tooltip
                      arrow
                      placement='top'
                      title={
                        license.licenseDuration?.durationType === LicenseDurationType.Perpetual
                          ? translate('Tooltip.LicenseDurationPerpetual')
                          : translate('Tooltip.LicenseDurationTimeLimited')
                      }>
                      <InfoOutlinedIcon
                        fontSize='small'
                        className={classes.icon}
                        data-testid='duration-info-icon'
                      />
                    </Tooltip>
                  </Grid>
                </Grid>
              </Grid>
            )}
          </Grid>
          <Grid item marginTop={1} marginBottom={1}>
            <Typography variant='body2' color='secondary' whiteSpace='pre-wrap'>
              {license.description}
            </Typography>
          </Grid>
          <Grid item container flexDirection='column' spacing={1.5}>
            <Grid item>
              <Typography variant='h5'>{translate('Label.EligibilityRequirements')}</Typography>
            </Grid>
            <Grid item XSmall={12}>
              <AmDivider />
            </Grid>
            <Grid item container overflow='hidden'>
              <Grid item XSmall={6}>
                <Typography variant='body2' color='secondary'>
                  {translate('Label.MinAvgDaus')}
                </Typography>
              </Grid>
              <Grid item XSmall={6}>
                <Typography variant='largeLabel2' display='block' noWrap textAlign='right'>
                  {translate(getDauLicenseLabelFromEnum(license.dau7DayThreshold as DauBucket))}
                </Typography>
              </Grid>
            </Grid>
            <Grid item XSmall={12}>
              <AmDivider />
            </Grid>
            <Grid item container overflow='hidden' marginBottom={1}>
              <Grid item container XSmall={6} className={classes.tooltipContainer}>
                <Typography variant='body2' color='secondary'>
                  {translate('Label.MaxMaturityRating')}
                </Typography>
                <Grid item className={classes.tooltip}>
                  <Tooltip
                    arrow
                    placement='right'
                    title={translate('Label.TooltipMaxMaturityRating')}>
                    <InfoOutlinedIcon fontSize='small' className={classes.icon} />
                  </Tooltip>
                </Grid>
              </Grid>
              <Grid item XSmall={6}>
                <Typography variant='largeLabel2' display='block' noWrap textAlign='right'>
                  {translate(getMaturityRatingLabel(license.maxAgeRating))}
                </Typography>
              </Grid>
            </Grid>
            <Grid item>
              <Typography variant='h5'>{translate('Label.Limitations')}</Typography>
            </Grid>
            <Grid item XSmall={12}>
              <AmDivider />
            </Grid>
            <Grid item container justifyContent='space-between' spacing={1.5}>
              <Grid item container XSmall={6} className={classes.tooltipContainer}>
                <Typography variant='body2' color='secondary'>
                  {translate('Label.GuidelinesAndRestrictions')}
                </Typography>
                <Grid item className={classes.tooltip}>
                  <Tooltip
                    arrow
                    placement='right'
                    title={translate('Label.TooltipGuidelinesAndRestrictions')}>
                    <InfoOutlinedIcon
                      fontSize='small'
                      className={classes.icon}
                      data-testid='guidelines-info-icon'
                    />
                  </Tooltip>
                </Grid>
              </Grid>
              <Grid
                item
                container
                XSmall={6}
                flexDirection='column'
                overflow='hidden'
                spacing={1}
                alignItems='flex-end'>
                <Grid item XSmall>
                  <LinkButton onClick={handleGuidelinesAndRestrictionsClick}>
                    <Typography variant='largeLabel2' display='block' noWrap textAlign='right'>
                      {translate('Action.View')}
                    </Typography>
                  </LinkButton>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Grid container justifyContent='flex-end' spacing={1.5}>
          <Grid item>
            <Button
              size='large'
              variant='contained'
              color='secondary'
              onClick={() => setOpen(false)}>
              {translate('Action.Cancel')}
            </Button>
          </Grid>
          <Grid item>
            <Link href={LICENSE_APPLY_HREF(license.listingId!, license.id!)}>
              <Button
                size='large'
                variant='contained'
                color='primaryBrand'
                onClick={() =>
                  logEvent(LicenseManagerClickEvent.RequestLicenseClickEvent, {
                    licenseId: license.id!,
                  })
                }>
                {translate('Button.RequestLicense')}
              </Button>
            </Link>
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
};

export default LicenseDetailsModal;

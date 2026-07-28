import type { FunctionComponent, ReactNode } from 'react';
import {
  DauBucket,
  LicenseDurationType,
  type LicenseResponse,
} from '@rbx/client-content-licensing-api/v1';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Button, Grid, Typography, Tooltip, makeStyles, InfoOutlinedIcon } from '@rbx/ui';
import LinkButton from '@modules/ip/components/LinkButton';
import AmDivider from '@modules/ip/license-manager/components/AmDivider';
import { getDauLicenseLabelFromEnum } from '@modules/ip/license-manager/utils/dauEnum';
import {
  useLicenseManagerLogger,
  LicenseManagerClickEvent,
} from '@modules/ip/license-manager/utils/logger';
import { getMaturityRatingLabel } from '@modules/ip/license-manager/utils/maturityRating';
import { getDurationRangeLabel } from '@modules/ip/license-manager/utils/timeLimitedLicense';
import { Link, PageLoading } from '@modules/miscellaneous/components';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import { LICENSE_APPLY_HREF, type LicenseRequestCancelReturnToValue } from '../urls';
import { formatRoyaltyRate } from '../utils/format';
import { getLicenseTypeTranslationKeys } from '../utils/licenseTypeTranslationKeys';
import { getIsNonZeroRevShareFromValue } from '../utils/revShare';

function coerceDauBucketForDisplay(
  value: LicenseResponse['dau7DayThreshold'],
): DauBucket | undefined {
  if (value === DauBucket.None || value === DauBucket.Small || value === DauBucket.Large) {
    return value;
  }
  return undefined;
}

const useStyles = makeStyles()((theme) => ({
  tooltipContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    marginTop: -5, // counteracts added visual padding from tooltip
    minWidth: 0,
    width: '100%',
    maxWidth: '100%',
  },
  tooltip: {
    paddingTop: 5, // needed to actually center tooltip with text
    paddingLeft: 5,
    flexShrink: 0,
  },
  icon: {
    color: theme.palette.content.muted,
  },
  /** Equal-width flex children inside {@link subtitleMetricRow}. */
  metricColumnRoot: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.25),
    flex: '1 1 0',
    minWidth: 0,
    width: '100%',
  },
  metricLabelText: {
    flex: '0 1 auto',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  /** One horizontal row of license metrics (replaces Grid + spacing for predictable fill). */
  subtitleMetricRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing(1.5),
    width: '100%',
    minWidth: 0,
  },
  /** Vertical stack of two metric rows when four metrics are shown. */
  subtitleMetricsStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    width: '100%',
    minWidth: 0,
  },
}));

type LicenseDetailTileProps = {
  title: ReactNode;
  label: ReactNode;
  tooltipTitle: ReactNode;
  iconDataTestId?: string;
};

/** One titled metric + label row + info tooltip; flex child that grows to fill row width. */
function LicenseDetailTile({ title, label, tooltipTitle, iconDataTestId }: LicenseDetailTileProps) {
  const { classes } = useStyles();

  return (
    <div className={classes.metricColumnRoot}>
      <Typography variant='h6'>{title}</Typography>
      <div className={classes.tooltipContainer}>
        <Typography variant='body1' color='secondary' noWrap className={classes.metricLabelText}>
          {label}
        </Typography>
        <div className={classes.tooltip}>
          <Tooltip arrow placement='top' title={tooltipTitle}>
            <InfoOutlinedIcon
              fontSize='small'
              className={classes.icon}
              data-testid={iconDataTestId}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

interface LicenseDetailsModalProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  license: LicenseResponse | null;
  handleGuidelinesAndRestrictionsClick?: () => void;
  /** If set, canceling the license request flow returns to the catalog instead of listing details. */
  licenseRequestCancelReturnTo?: LicenseRequestCancelReturnToValue;
}

/** A popup modal that provides additional details about the license's rev share, content standards, etc. */
const LicenseDetailsModal: FunctionComponent<LicenseDetailsModalProps> = ({
  isOpen,
  setOpen,
  license,
  handleGuidelinesAndRestrictionsClick,
  licenseRequestCancelReturnTo,
}) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const { logEvent } = useLicenseManagerLogger();
  const { isFetched } = useSettings();
  const { frontendFlags, loadingFrontendFlags } = useToolboxServiceApiProvider();

  if (!license) {
    return null;
  }

  if (!isFetched || loadingFrontendFlags) {
    return <PageLoading />;
  }

  const enableCollaborationLicensing =
    frontendFlags[FrontendFlagName.FrontendFlagEnableCreatorCollaborationLicensing] ?? false;
  const licenseTypeLabels = getLicenseTypeTranslationKeys(license.licenseType);

  const listingId = license.listingId;
  const licenseId = license.id;
  const canRequestLicense =
    typeof listingId === 'string' &&
    listingId.length > 0 &&
    typeof licenseId === 'string' &&
    licenseId.length > 0;

  const showRevShareTiming = getIsNonZeroRevShareFromValue(license.royaltyRate);
  const subtitleMetricCount =
    2 + (enableCollaborationLicensing ? 1 : 0) + (showRevShareTiming ? 1 : 0);
  const hasFourSubtitleMetrics = subtitleMetricCount === 4;

  const licenseDurationTooltipTitle =
    license.licenseDuration?.durationType === LicenseDurationType.TimeLimited
      ? translate('Tooltip.LicenseDurationTimeLimited')
      : translate('Tooltip.LicenseDurationPerpetual');

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setOpen(false);
        }
      }}
      size='Large'
      isModal
      hasCloseAffordance
      closeLabel={translate('Action.Close')}>
      <DialogContent className='width-full min-width-0'>
        <DialogBody className='width-full min-width-0'>
          <DialogTitle className='margin-none width-full'>
            <Typography variant='h4'>{license.name}</Typography>
          </DialogTitle>
          <Grid container flexDirection='column' paddingTop={1.5} gap={1.5} className='width-full'>
            <Grid item XSmall={12} className='width-full'>
              {hasFourSubtitleMetrics ? (
                <div className={classes.subtitleMetricsStack}>
                  <div className={classes.subtitleMetricRow}>
                    <LicenseDetailTile
                      title={formatRoyaltyRate(license.royaltyRate)}
                      label={translate('Label.RevenueShare')}
                      tooltipTitle={translate('Label.TooltipGrossRevShare')}
                    />
                    <LicenseDetailTile
                      title={translate(
                        license.enableMonetization
                          ? 'Label.RevShareOnActivation'
                          : 'Label.RevShareLater',
                      )}
                      label={translate('Label.RevShareTiming')}
                      tooltipTitle={translate('Label.TooltipRevShareTiming')}
                    />
                  </div>
                  <div className={classes.subtitleMetricRow}>
                    {enableCollaborationLicensing && (
                      <LicenseDetailTile
                        title={translate(licenseTypeLabels.detail)}
                        label={translate('Label.LicenseType')}
                        tooltipTitle={translate(licenseTypeLabels.tooltip)}
                      />
                    )}
                    <LicenseDetailTile
                      title={getDurationRangeLabel(translate, license.licenseDuration)}
                      label={translate('Label.LicenseDuration')}
                      tooltipTitle={licenseDurationTooltipTitle}
                      iconDataTestId='duration-info-icon'
                    />
                  </div>
                </div>
              ) : (
                <div className={classes.subtitleMetricRow}>
                  <LicenseDetailTile
                    title={formatRoyaltyRate(license.royaltyRate)}
                    label={translate('Label.RevenueShare')}
                    tooltipTitle={translate('Label.TooltipGrossRevShare')}
                  />
                  {showRevShareTiming && (
                    <LicenseDetailTile
                      title={translate(
                        license.enableMonetization
                          ? 'Label.RevShareOnActivation'
                          : 'Label.RevShareLater',
                      )}
                      label={translate('Label.RevShareTiming')}
                      tooltipTitle={translate('Label.TooltipRevShareTiming')}
                    />
                  )}
                  {enableCollaborationLicensing && (
                    <LicenseDetailTile
                      title={translate(licenseTypeLabels.detail)}
                      label={translate('Label.LicenseType')}
                      tooltipTitle={translate(licenseTypeLabels.tooltip)}
                    />
                  )}
                  <LicenseDetailTile
                    title={getDurationRangeLabel(translate, license.licenseDuration)}
                    label={translate('Label.LicenseDuration')}
                    tooltipTitle={licenseDurationTooltipTitle}
                    iconDataTestId='duration-info-icon'
                  />
                </div>
              )}
            </Grid>
            <Grid item className='text-body-medium content-default margin-none width-full'>
              <Typography variant='body2' color='secondary' whiteSpace='pre-wrap'>
                {license.description}
              </Typography>
            </Grid>
            <Grid item container flexDirection='column' spacing={1.5} className='width-full'>
              <Grid item>
                <Typography variant='h5'>{translate('Label.EligibilityRequirements')}</Typography>
              </Grid>
              <Grid item>
                <AmDivider />
              </Grid>
              <Grid item container>
                <Grid item XSmall={7}>
                  <Typography variant='body2' color='secondary'>
                    {translate('Label.MinAvgDaus')}
                  </Typography>
                </Grid>
                <Grid item container XSmall={5} flexDirection='column' alignItems='flex-end'>
                  <Grid item>
                    <Typography variant='body2' noWrap>
                      <strong>
                        {translate(
                          getDauLicenseLabelFromEnum(
                            coerceDauBucketForDisplay(license.dau7DayThreshold),
                          ),
                        )}
                      </strong>
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item>
                <AmDivider />
              </Grid>
              <Grid item container>
                <Grid item container XSmall={7} className={classes.tooltipContainer}>
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
                <Grid item container XSmall={5} flexDirection='column' alignItems='flex-end'>
                  <Grid item>
                    <Typography variant='body2' noWrap>
                      <strong>{translate(getMaturityRatingLabel(license.maxAgeRating))}</strong>
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item>
                <Typography variant='h5'>{translate('Label.Limitations')}</Typography>
              </Grid>
              <Grid item>
                <AmDivider />
              </Grid>
              <Grid item container>
                <Grid item container XSmall={7} className={classes.tooltipContainer}>
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
                <Grid item container XSmall={5} flexDirection='column' alignItems='flex-end'>
                  <Grid item>
                    <LinkButton onClick={handleGuidelinesAndRestrictionsClick}>
                      <Typography variant='body2' noWrap>
                        <strong>{translate('Action.View')}</strong>
                      </Typography>
                    </LinkButton>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogBody>
        <DialogFooter className='width-full flex flex-col gap-small small:flex-row small:justify-end'>
          <Button variant='contained' color='secondary' onClick={() => setOpen(false)}>
            {translate('Action.Cancel')}
          </Button>
          {canRequestLicense ? (
            <Link href={LICENSE_APPLY_HREF(listingId, licenseId, licenseRequestCancelReturnTo)}>
              <Button
                variant='contained'
                color='primaryBrand'
                onClick={() =>
                  logEvent(LicenseManagerClickEvent.RequestLicenseClickEvent, {
                    licenseId,
                  })
                }>
                {translate('Button.RequestLicense')}
              </Button>
            </Link>
          ) : (
            <Button variant='contained' color='primaryBrand' disabled>
              {translate('Button.RequestLicense')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LicenseDetailsModal;

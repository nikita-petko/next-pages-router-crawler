import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import {
  Alert,
  AlertTitle,
  CloseIcon,
  FormControlLabel,
  Grid,
  IconButton,
  InfoIcon,
  Link,
  Switch,
  Typography,
  alpha,
  useTheme,
} from '@rbx/ui';
import { terms } from '@modules/miscellaneous/urls';
import AttestationSection from '../AttestationSection/AttestationSection';
import OverviewInlineUrlTranslationLabel from '../OverviewInlineUrlTranslationLabel';
import SongArtistsSection from '../SongArtistsSection/SongArtistsSection';
import type { SongArtist } from '../SongArtistsSection/useGetFriendsAsSongArtists';

type DiscoverabilitySectionProps = {
  assetId: number;
  isChartsEligible: boolean;
  isIdVerified: boolean;
  isAttested: boolean;
  isPublicSurfacingEnabled: boolean;
  isPublicSurfacingToggleDisabled?: boolean;
  songArtists: SongArtist[];
  onArtistsChange: (artists: SongArtist[]) => void;
  onAttestationChange: (isComplete: boolean) => void;
  onPublicSurfacingChange: (enabled: boolean) => void;
};

const EligibilityBannerDismissedKeyPrefix = 'discoverabilityEligibilityBannerDismissed';
const VerificationBannerDismissedKeyPrefix = 'discoverabilityVerificationBannerDismissed';

const DiscoverabilitySection: FunctionComponent<DiscoverabilitySectionProps> = ({
  assetId,
  isChartsEligible,
  isIdVerified,
  isAttested,
  isPublicSurfacingEnabled,
  isPublicSurfacingToggleDisabled = false,
  songArtists,
  onArtistsChange,
  onAttestationChange,
  onPublicSurfacingChange,
}) => {
  const theme = useTheme();
  const { translate } = useTranslation();

  const [isEligibilityBannerDismissed, setIsEligibilityBannerDismissed] = useLocalStorage(
    `${EligibilityBannerDismissedKeyPrefix}_${assetId}`,
    false,
  );
  const [isVerificationBannerDismissed, setIsVerificationBannerDismissed] = useLocalStorage(
    `${VerificationBannerDismissedKeyPrefix}_${assetId}`,
    false,
  );

  const handleToggleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onPublicSurfacingChange(e.target.checked);
    },
    [onPublicSurfacingChange],
  );

  const shouldShowGameDetailsPageDescription =
    isAttested &&
    ((isIdVerified && isChartsEligible) || (!isIdVerified && !isVerificationBannerDismissed));
  const shouldShowEligibilityBanner =
    isChartsEligible && !isPublicSurfacingToggleDisabled && !isEligibilityBannerDismissed;
  const shouldShowVerificationBanner =
    isAttested && !isIdVerified && !isVerificationBannerDismissed;
  const shouldShowInlineVerificationLink =
    isAttested && !isIdVerified && isVerificationBannerDismissed;
  const shouldShowIneligibleMessage = isAttested && isIdVerified && !isChartsEligible;
  const isToggleDisabled = isPublicSurfacingToggleDisabled || !isChartsEligible;
  const isToggleChecked =
    !isPublicSurfacingToggleDisabled && isChartsEligible && isPublicSurfacingEnabled;

  return (
    <Grid container item direction='column' spacing={1}>
      <Grid item XSmall={12}>
        <Typography component='h3' variant='h3' className='margin-bottom-none'>
          {translate('Heading.Discoverability')}
        </Typography>
      </Grid>

      <Grid item XSmall={12}>
        <Typography variant='body1' color='secondary'>
          {translate('Description.DiscoverabilitySubtitle')}
        </Typography>
      </Grid>
      <Grid item XSmall={12} style={{ marginTop: 16 }}>
        <Typography component='h4' variant='h5' className='margin-bottom-none'>
          {translate('Heading.SongArtist')}
        </Typography>
      </Grid>
      <Grid item XSmall={12} style={{ marginBottom: 12 }}>
        <Typography variant='body1' color='secondary'>
          {translate('Description.SongArtistSubtitle')}
        </Typography>
      </Grid>
      <Grid item XSmall={12}>
        <SongArtistsSection artists={songArtists} onArtistsChange={onArtistsChange} />
      </Grid>
      <Grid item XSmall={12} style={{ marginTop: 16 }}>
        <Typography component='h4' variant='h5' className='margin-bottom-none'>
          {translate('Heading.GameDetailsPage')}
        </Typography>
      </Grid>
      {shouldShowGameDetailsPageDescription && (
        <Grid item XSmall={12} style={{ marginBottom: 12 }}>
          <OverviewInlineUrlTranslationLabel
            anchorTargetUrl={terms.getGameDetailsPageDocsUrl()}
            closing='linkEnd'
            linkVariantOverride='body1'
            opening='linkStart'
            translationKey='Message.GameDetailsPageDescription'
            typographyColorOverride='secondary'
            typographyVariantOverride='body1'
          />
        </Grid>
      )}
      {shouldShowEligibilityBanner && (
        <Grid item XSmall={12}>
          <Alert
            severity='success'
            className='items-center'
            action={
              <IconButton
                aria-label={translate('Label.CloseEligibilityBanner')}
                color='inherit'
                size='small'
                onClick={() => setIsEligibilityBannerDismissed(true)}>
                <CloseIcon fontSize='small' />
              </IconButton>
            }>
            <AlertTitle color='inherit' className='margin-bottom-none'>
              {translate('Message.SongEligibleForGameDetailsPage')}
            </AlertTitle>
          </Alert>
        </Grid>
      )}
      {!isAttested && (
        <Grid item XSmall={12}>
          <AttestationSection
            descriptionKey='Description.AttestationForDiscoverability'
            descriptionLinkUrl={terms.getGameDetailsPageDocsUrl()}
            hideHeading
            isEditMode
            tosKey='Message.AttestationTOSAgreementOptional'
            onAttestationChange={onAttestationChange}
          />
        </Grid>
      )}
      {shouldShowVerificationBanner && (
        <Grid item XSmall={12}>
          <Alert
            severity='info'
            variant='outlined'
            className='items-center'
            sx={{
              backgroundColor: alpha(theme.palette.content.alert.inform, 20),
            }}
            icon={
              <span
                className='inline-flex items-center justify-center radius-circle clip height-[1em] width-[1em]'
                style={{ backgroundColor: 'white', fontSize: 'inherit' }}>
                <InfoIcon
                  style={{
                    color: theme.palette.actionV2.primaryBrand.fill,
                    fontSize: '1.3em',
                  }}
                />
              </span>
            }
            action={
              <div className='flex items-center'>
                <Link
                  href={terms.getAccountVerificationUrl()}
                  color='inherit'
                  style={{ fontWeight: 'bold', marginRight: 16 }}>
                  {translate('Action.Verify')}
                </Link>
                <IconButton
                  aria-label={translate('Label.CloseVerificationBanner')}
                  color='inherit'
                  size='small'
                  onClick={() => setIsVerificationBannerDismissed(true)}>
                  <CloseIcon fontSize='small' />
                </IconButton>
              </div>
            }>
            <AlertTitle color='inherit' className='margin-bottom-none'>
              {translate('Message.IDVerificationRequired')}
            </AlertTitle>
          </Alert>
        </Grid>
      )}
      {shouldShowInlineVerificationLink && (
        <Grid item XSmall={12}>
          <OverviewInlineUrlTranslationLabel
            anchorTargetUrl={terms.getAccountVerificationUrl()}
            closing='linkEnd'
            linkVariantOverride='body1'
            opening='linkStart'
            translationKey='Message.IDVerificationRequiredWithLink'
            typographyColorOverride='secondary'
            typographyVariantOverride='body1'
          />
        </Grid>
      )}
      {shouldShowIneligibleMessage && (
        <Grid item XSmall={12}>
          <OverviewInlineUrlTranslationLabel
            anchorTargetUrl={terms.getSongEligibilityDocsUrl()}
            closing='linkEnd'
            linkVariantOverride='body1'
            opening='linkStart'
            translationKey='Message.SongNotEligible'
            typographyColorOverride='secondary'
            typographyVariantOverride='body1'
          />
        </Grid>
      )}
      <Grid item XSmall={12}>
        <FormControlLabel
          control={
            <Switch
              aria-label={translate('Label.EnablePublicSurfacing')}
              checked={isToggleChecked}
              disabled={isToggleDisabled}
              onChange={handleToggleChange}
            />
          }
          label={
            <Typography variant='body1'>{translate('Label.ShowOnGameDetailsPage')}</Typography>
          }
        />
      </Grid>
    </Grid>
  );
};

export default DiscoverabilitySection;

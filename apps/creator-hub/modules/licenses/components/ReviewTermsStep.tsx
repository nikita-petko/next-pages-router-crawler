import type { FunctionComponent } from 'react';
import React, { useState, useCallback, useId } from 'react';
import type { LicenseResponse } from '@rbx/client-content-licensing-api/v1';
import { Checkbox } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Button, FormControlLabel, FormHelperText, Grid, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import LinkButton from '@modules/ip/components/LinkButton';
import GuidelinesAndRestrictionsSummaryModal from '@modules/ip/license-manager/components/GuidelinesAndRestrictionsSummaryModal';
import {
  LicenseManagerImpressionEvent,
  useLicenseManagerLoggerLogOnce,
} from '@modules/ip/license-manager/utils/logger';
import { PageLoading } from '@modules/miscellaneous/components';
import { Flex } from '@modules/miscellaneous/components/Flex';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import useApplyToLicenseContainerStyles from '../containers/ApplyToLicenseContainer.styles';

export interface ReviewTermsState {
  isConsentChecked: boolean;
  isGuidelinesAndRestrictionsReviewed: boolean;
  isGuidelinesAndRestrictionsChecked: boolean;
}

interface ReviewTermsStepProps {
  license: LicenseResponse;
  reviewTermsState: ReviewTermsState;
  setReviewTermsState: (state: ReviewTermsState) => void;
  onNext: () => void;
  onPrev: () => void;
  onCancel: () => void;
}

/** A component that displays a step in the request license flow where the user reviews the terms of the license. */
const ReviewTermsStep: FunctionComponent<ReviewTermsStepProps> = ({
  license,
  reviewTermsState,
  setReviewTermsState,
  onNext,
  onPrev,
  onCancel,
}) => {
  const translation = useTranslation();
  const { translate, translateHTML } = translation;
  const { tPendingHtmlTranslation } = useTranslationWrapper(translation);
  const { classes } = useApplyToLicenseContainerStyles();
  const { isFetched } = useSettings();
  const guidelinesCheckboxLabelId = useId();
  const consentCheckboxLabelId = useId();

  const { logOnce } = useLicenseManagerLoggerLogOnce();
  logOnce(LicenseManagerImpressionEvent.AcknowledgeTermsStepImpressionEvent);

  const [internalState, setInternalState] = useState<ReviewTermsState>(reviewTermsState);
  const [checkboxErrorMessage, setCheckboxErrorMessage] = useState<string | null>(null);
  const [guidelinesAndRestrictionsErrorMessage, setGuidelinesAndRestrictionsErrorMessage] =
    useState<string | null>(null);
  const [isGuidelinesAndRestrictionsModalOpen, setIsGuidelinesAndRestrictionsModalOpen] =
    useState(false);

  const onClickNext = useCallback(() => {
    const {
      isGuidelinesAndRestrictionsReviewed,
      isGuidelinesAndRestrictionsChecked,
      isConsentChecked,
    } = internalState;
    if (!isGuidelinesAndRestrictionsReviewed) {
      setGuidelinesAndRestrictionsErrorMessage(
        translate('Label.ErrorGuidelinesAndRestrictionsNotReviewed'),
      );
    }
    if (!isGuidelinesAndRestrictionsChecked || !isConsentChecked) {
      setCheckboxErrorMessage(translate('Label.ErrorCheckboxNotChecked'));
    }
    if (
      isGuidelinesAndRestrictionsReviewed &&
      isGuidelinesAndRestrictionsChecked &&
      isConsentChecked
    ) {
      setGuidelinesAndRestrictionsErrorMessage(null);
      setCheckboxErrorMessage(null);
      setReviewTermsState(internalState);
      onNext();
    }
  }, [internalState, onNext, setReviewTermsState, translate]);

  const onClickPrev = useCallback(() => {
    setReviewTermsState(internalState);
    onPrev();
  }, [internalState, onPrev, setReviewTermsState]);

  const handleGuidelinesAndRestrictionsCheckboxChange = useCallback(
    (nextChecked: boolean) => {
      const { isGuidelinesAndRestrictionsReviewed, isConsentChecked } = internalState;

      if (nextChecked && !isGuidelinesAndRestrictionsReviewed) {
        setGuidelinesAndRestrictionsErrorMessage(
          translate('Label.ErrorGuidelinesAndRestrictionsNotReviewed'),
        );
        return;
      }

      if (nextChecked && isConsentChecked) {
        setCheckboxErrorMessage(null);
      }
      setInternalState((prev) => ({
        ...prev,
        isGuidelinesAndRestrictionsChecked: nextChecked,
      }));
    },
    [internalState, translate],
  );

  const handleGuidelinesAndRestrictionsClick = useCallback(() => {
    setIsGuidelinesAndRestrictionsModalOpen(true);
    setGuidelinesAndRestrictionsErrorMessage(null);
    setInternalState((prev) => ({ ...prev, isGuidelinesAndRestrictionsReviewed: true }));
  }, []);

  const handleConsentCheckboxChange = useCallback(
    (nextChecked: boolean) => {
      if (nextChecked && internalState.isGuidelinesAndRestrictionsChecked) {
        setCheckboxErrorMessage(null);
      }
      setInternalState((prev) => ({ ...prev, isConsentChecked: nextChecked }));
    },
    [internalState],
  );

  const termTags = [
    {
      opening: 'boldStart',
      closing: 'boldEnd',
      content(chunks: React.ReactNode) {
        return <b>{chunks}</b>;
      },
    },
  ];

  if (!isFetched) {
    return <PageLoading />;
  }

  return (
    <>
      <Grid container flexDirection='column' padding={1.5} spacing={2}>
        <Grid item width='auto'>
          <Typography variant='h6'>{translate('Description.SummaryOfTerms')}</Typography>
        </Grid>
        <Grid
          item
          container
          flexDirection='column'
          alignItems='left'
          spacing={1}
          paddingBottom={3}
          width='50%'>
          <Grid item>
            <Typography variant='body2'>
              {tPendingHtmlTranslation(
                '{boldStart}Revenue Share & Data.{boldEnd} The rights holder will receive a share of the gross Robux you earn from the licensed creation. They will also receive certain data about the creation. Some rights holders may defer collecting their revenue share on a license to a future date of their choosing.',
                'Migrated from a json, contact Angelica Quach (aquach) for more info',
                translationKey('Label.TermsRevShareAndData', TranslationNamespace.Licenses),
                termTags,
              )}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>
              {tPendingHtmlTranslation(
                '{boldStart}Content Standards & Brand Guidelines.{boldEnd} You must comply with all Content Standards and Brand Guidelines provided by the rights holder.',
                'Migrated from a json, contact Angelica Quach (aquach) for more info',
                translationKey('Label.TermsContentStandards', TranslationNamespace.Licenses),
                termTags,
              )}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>
              {tPendingHtmlTranslation(
                "{boldStart}Licensed IP.{boldEnd} This license only allows you to use the specific IP licensed and no other IP. As a reminder, you are required to only upload content that you have the rights or permission to use. Remember to treat any IP you're using with respect and conduct yourself professionally on/off platform.",
                'Terms specific to Licensed IP that is shown to Creator\'s in the "Acknowledge Terms" step when they are requesting a license. An approved license request would allow the Creator to use the rights holder\'s IP (intellectual property) in their creation.',
                translationKey('Label.TermsLicensedIpV2', TranslationNamespace.Licenses),
                termTags,
              )}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>
              {tPendingHtmlTranslation(
                '{boldStart}On-Platform Usage.{boldEnd} Unless the Content Standards say otherwise, your permission to use the licensed IP is limited to the Roblox platform and does not extend to off-platform activity including promotion of your content on social media.',
                'Terms specific to On-Platform Usage that is shown to Creator\'s in the "Acknowledge Terms" step when they are requesting a license. An approved license request would allow the Creator to use the rights holder\'s IP (intellectual property) in their creation.',
                translationKey('Label.TermsOnPlatformUsageV2', TranslationNamespace.Licenses),
                termTags,
              )}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>
              {tPendingHtmlTranslation(
                '{boldStart}Time-Limited Licenses.{boldEnd} If you enter into a time-limited license you agree to only use the IP during the duration specified by the agreement and to take steps to remove the IP following the expiration of the license.',
                'Terms specific to Time-Limited Licenses that is shown to Creator\'s in the "Acknowledge Terms" step when they are requesting a license. An approved license request would allow the Creator to use the rights holder\'s IP (intellectual property) in their creation.',
                translationKey('Label.TermsTimeLimitedLicenses', TranslationNamespace.Licenses),
                termTags,
              )}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>
              {tPendingHtmlTranslation(
                '{boldStart}Termination.{boldEnd} In the scenario that the license is terminated (by you, the rights holder, or Roblox), you may be required to stop using the IP, including removing the licensed IP from your content or halting sales of the content if the content cannot be modified. Learn more here.',
                'Terms specific to Termination that is shown to Creator\'s in the "Acknowledge Terms" step when they are requesting a license. An approved license request would allow the Creator to use the rights holder\'s IP (intellectual property) in their creation.',
                translationKey('Label.TermsTerminationV2', TranslationNamespace.Licenses),
                termTags,
              )}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>
              {tPendingHtmlTranslation(
                '{boldStart}Inbox for Updates.{boldEnd} Keep an eye on your Inbox messages for important communications from the rights holder, such as change requests to conform with their Content Standards and Brand Guidelines. Some requests may require a timely response. Failure to respond could result in loss of your license.',
                'Migrated from a json, contact Angelica Quach (aquach) for more info',
                translationKey('Label.TermsInboxForUpdates', TranslationNamespace.Licenses),
                termTags,
              )}
            </Typography>
          </Grid>
        </Grid>
        <Grid item container flexDirection='column' alignItems='stretch'>
          <Grid item>
            <Typography variant='h6' className={classes.reviewTermsAgreeHeading}>
              {translate('Description.ReviewAndAgreeToTerms')}
            </Typography>
          </Grid>
          <Grid
            item
            container
            flexDirection='column'
            alignItems='left'
            className={classes.reviewTermsFirstCheckboxBlock}>
            <FormControlLabel
              classes={{ root: classes.reviewTermsCheckboxFormLabel }}
              control={
                <span className={classes.reviewTermsCheckboxControlSlot}>
                  <Checkbox
                    isChecked={internalState.isGuidelinesAndRestrictionsChecked}
                    color='primary'
                    size='Small'
                    placement='Start'
                    aria-labelledby={guidelinesCheckboxLabelId}
                    onCheckedChange={(value) =>
                      handleGuidelinesAndRestrictionsCheckboxChange(value === true)
                    }
                    data-testid='apply-to-license-guidelines-checkbox'
                  />
                </span>
              }
              label={
                <span id={guidelinesCheckboxLabelId}>
                  {translateHTML('Label.GuidelinesAndRestrictionsCheckbox', [
                    {
                      opening: 'linkStart',
                      closing: 'linkEnd',
                      content() {
                        return (
                          <LinkButton
                            className={classes.inlineLinkButton}
                            onClick={handleGuidelinesAndRestrictionsClick}
                            data-testid='apply-to-license-guidelines-link'>
                            {translate('Label.GuidelinesAndRestrictions')}
                          </LinkButton>
                        );
                      },
                    },
                  ])}
                </span>
              }
            />
            <Grid item>
              {guidelinesAndRestrictionsErrorMessage && (
                <FormHelperText error classes={{ root: classes.errorMessageStyle }}>
                  {guidelinesAndRestrictionsErrorMessage}
                </FormHelperText>
              )}
            </Grid>
          </Grid>
          <Grid item className={classes.reviewTermsConsentCheckboxRow}>
            <FormControlLabel
              classes={{ root: classes.reviewTermsCheckboxFormLabel }}
              control={
                <span className={classes.reviewTermsCheckboxControlSlot}>
                  <Checkbox
                    isChecked={internalState.isConsentChecked}
                    color='primary'
                    size='Small'
                    placement='Start'
                    aria-labelledby={consentCheckboxLabelId}
                    onCheckedChange={(value) => handleConsentCheckboxChange(value === true)}
                    data-testid='apply-to-license-consent-checkbox'
                  />
                </span>
              }
              label={
                <span id={consentCheckboxLabelId}>
                  {translate('Label.ParentalConsentCheckbox')}
                </span>
              }
            />
          </Grid>
          <Grid item>
            {checkboxErrorMessage && (
              <FormHelperText error classes={{ root: classes.errorMessageStyle }}>
                {checkboxErrorMessage}
              </FormHelperText>
            )}
          </Grid>
        </Grid>
        {/* TODO - aquach - remove marginTop once StickyFooter is implemented */}
        <Grid item marginTop={6}>
          <Flex flexDirection='row' gap={10}>
            <Button
              variant='text'
              color='secondary'
              onClick={onCancel}
              data-testid='apply-to-license-step-cancel'>
              {translate('Action.Cancel')}
            </Button>
            <Button
              variant='outlined'
              color='secondary'
              onClick={onClickPrev}
              data-testid='apply-to-license-step-back'>
              {translate('Action.Back')}
            </Button>
            <Button
              variant='contained'
              onClick={onClickNext}
              data-testid='apply-to-license-step-next'>
              {translate('Action.Next')}
            </Button>
          </Flex>
        </Grid>
      </Grid>
      <GuidelinesAndRestrictionsSummaryModal
        isOpen={isGuidelinesAndRestrictionsModalOpen}
        setOpen={setIsGuidelinesAndRestrictionsModalOpen}
        license={license}
        isCreator
      />
    </>
  );
};

export default ReviewTermsStep;

import type { FunctionComponent } from 'react';
import React, { useState, useCallback, useId } from 'react';
import type { LicenseResponse } from '@rbx/client-content-licensing-api/v1';
import { Checkbox } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Button, FormControlLabel, FormHelperText, Grid, Typography } from '@rbx/ui';
import LinkButton from '@modules/ip/components/LinkButton';
import GuidelinesAndRestrictionsSummaryModal from '@modules/ip/license-manager/components/GuidelinesAndRestrictionsSummaryModal';
import {
  LicenseManagerImpressionEvent,
  useLicenseManagerLoggerLogOnce,
} from '@modules/ip/license-manager/utils/logger';
import { PageLoading } from '@modules/miscellaneous/components';
import { Flex } from '@modules/miscellaneous/components/Flex';
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
  const { translate, translateHTML } = useTranslation();
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

  const styledTerm = (label: string) => {
    return translateHTML(label, [
      {
        opening: 'boldStart',
        closing: 'boldEnd',
        content(chunks) {
          return <b>{chunks}</b>;
        },
      },
    ]);
  };

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
            <Typography variant='body2'>{styledTerm('Label.TermsRevShareAndData')}</Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>{styledTerm('Label.TermsContentStandards')}</Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>{styledTerm('Label.TermsLicensedIpV2')}</Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>{styledTerm('Label.TermsOnPlatformUsageV2')}</Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>{styledTerm('Label.TermsTimeLimitedLicenses')}</Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>{styledTerm('Label.TermsTerminationV2')}</Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>{styledTerm('Label.TermsInboxForUpdates')}</Typography>
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

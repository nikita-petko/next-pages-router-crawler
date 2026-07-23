import React, { FunctionComponent, useState, useCallback } from 'react';
import { Button, Checkbox, FormControlLabel, FormHelperText, Grid, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { Flex } from '@modules/miscellaneous/common/components';
import GuidelinesAndRestrictionsSummaryModal from '@modules/ip/license-manager/components/GuidelinesAndRestrictionsSummaryModal';
import LinkButton from '@modules/ip/components/LinkButton';
import {
  LicenseManagerImpressionEvent,
  useLicenseManagerLoggerLogOnce,
} from '@modules/ip/license-manager/utils/logger';
import { LicenseResponse } from '@rbx/clients/contentLicensingApi/v1';
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
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { isGuidelinesAndRestrictionsReviewed, isConsentChecked } = internalState;
      // TODO - prevent checkbox from being checked if isGuidelinesAndRestrictionsReviewed is false
      if (!isGuidelinesAndRestrictionsReviewed) {
        setGuidelinesAndRestrictionsErrorMessage(
          translate('Label.ErrorGuidelinesAndRestrictionsNotReviewed'),
        );
      }
      if (event.target.checked && isConsentChecked) {
        setCheckboxErrorMessage(null);
      }
      setInternalState((prev) => ({
        ...prev,
        isGuidelinesAndRestrictionsChecked: event.target.checked,
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
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.checked && internalState.isGuidelinesAndRestrictionsChecked) {
        setCheckboxErrorMessage(null);
      }
      setInternalState((prev) => ({ ...prev, isConsentChecked: event.target.checked }));
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

  return (
    <React.Fragment>
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
            <Typography variant='body2'>{styledTerm('Label.TermsLicensedIp')}</Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>{styledTerm('Label.TermsOnPlatformUsage')}</Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>{styledTerm('Label.TermsTermination')}</Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>{styledTerm('Label.TermsInboxForUpdates')}</Typography>
          </Grid>
        </Grid>
        <Grid item width='auto'>
          <Typography variant='h6'>{translate('Description.ReviewAndAgreeToTerms')}</Typography>
        </Grid>
        <Grid item container flexDirection='column' alignItems='left'>
          <Grid item container flexDirection='column' alignItems='left'>
            <FormControlLabel
              control={
                <Checkbox
                  checked={internalState.isGuidelinesAndRestrictionsChecked}
                  color='primary'
                  size='medium'
                  onChange={handleGuidelinesAndRestrictionsCheckboxChange}
                  inputProps={
                    {
                      'data-testid': 'apply-to-license-guidelines-checkbox',
                    } as React.InputHTMLAttributes<HTMLInputElement>
                  }
                />
              }
              label={translateHTML('Label.GuidelinesAndRestrictionsCheckbox', [
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
            />
            <Grid item>
              {guidelinesAndRestrictionsErrorMessage && (
                <FormHelperText error classes={{ root: classes.errorMessageStyle }}>
                  {guidelinesAndRestrictionsErrorMessage}
                </FormHelperText>
              )}
            </Grid>
          </Grid>
          <FormControlLabel
            control={
              <Checkbox
                checked={internalState.isConsentChecked}
                color='primary'
                size='medium'
                onChange={handleConsentCheckboxChange}
                inputProps={
                  {
                    'data-testid': 'apply-to-license-consent-checkbox',
                  } as React.InputHTMLAttributes<HTMLInputElement>
                }
              />
            }
            label={translate('Label.ParentalConsentCheckbox')}
          />
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
    </React.Fragment>
  );
};

export default ReviewTermsStep;

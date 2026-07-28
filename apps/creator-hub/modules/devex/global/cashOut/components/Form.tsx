import type { FunctionComponent } from 'react';
import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { numberFormatter } from '@rbx/core';
import { useTranslation, useLocalization } from '@rbx/intl';
import {
  Grid,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  useMediaQuery,
  Divider,
  Button,
  Link,
  RobuxIcon,
  WarningIcon,
  Collapse,
  ExpandMoreIcon,
} from '@rbx/ui';
import type { DevexRequest } from '@modules/clients/billing';
import billingClient from '@modules/clients/billing';
import type { GetDevExInfoResponse } from '@modules/clients/economy';
import { getResponseFromError } from '@modules/clients/utils';
import { getDevexTermsURL, getDevexInfoURL } from '../../constants/externalLinkConstants';
import { isCashOutBlockedBySuspension } from '../../devex/utils/devexEligibility';
import { getCashOutPayoutInfoLastUpdatedLabel } from '../constants/payoutInfoBannerConstants';
import {
  allocateDevexWatermarkBuckets,
  normalizeEstimatedFiatResponse,
  resolveHeadlineUsdForRobuxAmount,
  type NormalizedEstimatedFiat,
} from '../utils/devexWatermarkUtil';
import { defaultErrorCode, getErrorMessage } from '../utils/errorMessageMapping';
import getFormValidation, { sanitizeRobuxAmountInput } from '../utils/formValidation';
import CashOutPayoutInfoBanner from './CashOutPayoutInfoBanner';
import CashOutRobuxRateBreakdown, {
  type CashOutRateBreakdownTierLine,
} from './CashOutRobuxRateBreakdown';
import useFormStyles from './Form.styles';

interface FormProps {
  cashoutInfo: GetDevExInfoResponse;
  submitRequest: (request: DevexRequest) => Promise<void>;
  onCancelCashout: () => void;
}

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  robuxAmount: number;
  agreeTOS: boolean;
  agreeInfo: boolean;
};

type SubmitErrorBody = { errors?: Array<{ code: number }> };
const isSubmitErrorBody = (v: unknown): v is SubmitErrorBody =>
  typeof v === 'object' && v !== null && 'errors' in v;

/* oxlint-disable react/react-compiler -- react-hook-form watch() is incompatible with React Compiler memoization */
const Form: FunctionComponent<React.PropsWithChildren<FormProps>> = ({
  cashoutInfo,
  submitRequest,
  onCancelCashout,
}) => {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ mode: 'onTouched' });

  const [submitErrorCode, setSubmitErrorCode] = useState<number | null>(null);
  const [estimate, setEstimate] = useState<NormalizedEstimatedFiat | null>(null);
  const [robuxRateBreakdownExpanded, setRobuxRateBreakdownExpanded] = useState(false);

  const { translate, translateHTML } = useTranslation();
  const { locale } = useLocalization();
  const {
    classes: {
      root,
      textField,
      errorAdornment,
      robuxAdornment,
      robuxError,
      marginRight,
      robuxAmountHelperContent,
      robuxRateSummaryToggle,
      availableRobuxHelper,
      robuxRateBreakdownContainer,
      helperText,
      expandIcon,
      expandIconExpanded,
    },
  } = useFormStyles();
  const helperTextClass = `${helperText} text-body-small`;
  const isCompactView = useMediaQuery((muiTheme) => muiTheme.breakpoints.down('Medium'));

  const formValidation = getFormValidation(translate, cashoutInfo);

  const isFirstTimeDevexer = () => !cashoutInfo.lastImbursementSubmissionDate;

  const validUserCashoutRobux = () =>
    formValidation.userRobux !== undefined &&
    formValidation.userRobux - watch('robuxAmount') >= 0 &&
    cashoutInfo.minRobuxToCashOut !== undefined;

  const enableSubmit = () => {
    return (
      !isSubmitting &&
      !isCashOutBlockedBySuspension(cashoutInfo) &&
      watch('agreeTOS') &&
      (!isFirstTimeDevexer() || watch('agreeInfo'))
    );
  };

  const onSubmit = async (data: FormData) => {
    // Reuse the tiers already computed for the rate breakdown UI so what we
    // submit matches exactly what was displayed. Per the API contract, sending
    // 0/0 preserves legacy behavior (full robuxAmount debited against
    // Standard); otherwise both must be non-negative and sum to robuxAmount.
    // Fall back to 0/0 if the tiers don't fully cover the submitted amount
    // (e.g. estimate still loading) so we don't trip the sum-invariant.
    const tierO18 = rateBreakdownTiers.o18Tier?.robux ?? 0;
    const tierStandard = rateBreakdownTiers.r35Tier.robux + rateBreakdownTiers.r38Tier.robux;
    const tiersCoverAmount = tierStandard + tierO18 === data.robuxAmount;
    const standardAmount = tiersCoverAmount ? tierStandard : 0;
    const o18Amount = tiersCoverAmount ? tierO18 : 0;

    const request: DevexRequest = {
      request: {
        firstName: data.firstName,
        lastName: data.lastName,
        emailAddress: data.email,
        password: data.password,
        robuxAmount: data.robuxAmount,
        standardAmount,
        o18Amount,
      },
    };

    try {
      await submitRequest(request);
    } catch (e) {
      try {
        const r = getResponseFromError(e);
        const rawBody: unknown = await r?.json();
        const body = isSubmitErrorBody(rawBody) ? rawBody : undefined;
        const submitErrors = body?.errors;

        if (submitErrors !== undefined && submitErrors.length > 0) {
          setSubmitErrorCode(submitErrors[0].code);
        } else {
          setSubmitErrorCode(defaultErrorCode);
        }
      } catch {
        setSubmitErrorCode(defaultErrorCode);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await billingClient.DevexAPI.v1EstimatedFiatGet({ robuxAmount: 0 });
        const normalized = normalizeEstimatedFiatResponse(response);
        if (!cancelled) {
          setEstimate(normalized);
        }
      } catch {
        // estimate stays null on API failure
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const tempRobuxAmount = watch('robuxAmount') ?? 0;

  const { robuxToUSD, fiatAllocation, rateBreakdownTiers } = useMemo(() => {
    if (estimate === null) {
      return {
        robuxToUSD: undefined as number | undefined,
        fiatAllocation: { buckets: [], totalRobux: 0, totalUsd: 0 },
        rateBreakdownTiers: {
          o18Tier: null as CashOutRateBreakdownTierLine | null,
          r35Tier: { robux: 0, usd: 0, rate: 0 },
          r38Tier: { robux: 0, usd: 0, rate: 0 },
        },
      };
    }
    const allocation = allocateDevexWatermarkBuckets(tempRobuxAmount, estimate);
    const headlineUsd = resolveHeadlineUsdForRobuxAmount(tempRobuxAmount, allocation);
    const o18Bucket = allocation.buckets.find((b) => b.key === 'O18');
    const r35Bucket = allocation.buckets.find((b) => b.key === 'R35');
    const r38Bucket = allocation.buckets.find((b) => b.key === 'R38');

    const o18Tier = estimate.shouldDisplayEffectiveO18Robux
      ? {
          robux: o18Bucket?.robux ?? 0,
          usd: o18Bucket?.usd ?? 0,
          rate: estimate.effectiveO18ToUsdRate,
        }
      : null;

    const tiers = {
      o18Tier,
      r35Tier: {
        robux: r35Bucket?.robux ?? 0,
        usd: r35Bucket?.usd ?? 0,
        rate: estimate.robuxAt35ToUsdRate,
      },
      r38Tier: {
        robux: r38Bucket?.robux ?? 0,
        usd: r38Bucket?.usd ?? 0,
        rate: estimate.robuxAt38ToUsdRate,
      },
    };

    return {
      robuxToUSD: headlineUsd,
      fiatAllocation: allocation,
      rateBreakdownTiers: tiers,
    };
  }, [estimate, tempRobuxAmount]);

  const availableRobux =
    validUserCashoutRobux() && formValidation.userRobux !== undefined
      ? (formValidation.userRobux - watch('robuxAmount')).toLocaleString()
      : formValidation.userRobux?.toLocaleString();

  const errorIcon = useMemo(
    () => (
      <div className={errorAdornment}>
        <WarningIcon fontSize='small' />
      </div>
    ),
    [errorAdornment],
  );

  const robuxIcon = useMemo(() => <RobuxIcon fontSize='inherit' />, []);
  const robuxAmountRegistration = register('robuxAmount', formValidation.validateRobux);

  return (
    <form onSubmit={handleSubmit(onSubmit)} data-testid='devex-cashout-form'>
      <Grid container className={root} spacing={3}>
        <Grid item>
          <Typography variant={isCompactView ? 'h3' : 'h1'}>
            {translate('Heading.DevExV2')}
          </Typography>
        </Grid>
        <Grid item>
          <Typography color='secondary' variant='body1'>
            {translateHTML('Description.FormInstructionV2', [
              {
                opening: 'helpLinkStart',
                closing: 'helpLinkEnd',
                content(chunks) {
                  return (
                    <Link href={getDevexInfoURL(locale)} target='_blank'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ])}
          </Typography>
        </Grid>
        <Grid item>
          <TextField
            id='firstNameId'
            data-testid='devex-form-first-name'
            label={`${translate('Label.FirstName')}*`}
            className={textField}
            InputProps={{
              endAdornment: errors.firstName !== undefined && errorIcon,
            }}
            FormHelperTextProps={{ className: helperTextClass }}
            error={errors.firstName !== undefined}
            helperText={errors.firstName?.message}
            {...register('firstName', formValidation.validateName)}
          />
        </Grid>
        <Grid item>
          <TextField
            id='lastNameId'
            data-testid='devex-form-last-name'
            label={`${translate('Label.LastName')}*`}
            className={textField}
            InputProps={{
              endAdornment: errors.lastName !== undefined && errorIcon,
            }}
            FormHelperTextProps={{ className: helperTextClass }}
            error={errors.lastName !== undefined}
            helperText={errors.lastName?.message}
            {...register('lastName', formValidation.validateName)}
          />
        </Grid>
        <Grid item>
          <TextField
            id='emailId'
            data-testid='devex-form-email'
            type='email'
            label={`${translate('Label.EmailAddress')}*`}
            helperText={errors.email?.message ?? translate('Label.EmailAddressRequirement')}
            className={textField}
            InputProps={{
              endAdornment: errors.email !== undefined && errorIcon,
            }}
            FormHelperTextProps={{ className: helperTextClass }}
            error={errors.email !== undefined}
            {...register('email', formValidation.validateEmail)}
          />
        </Grid>
        <Grid item>
          <TextField
            id='passwordId'
            data-testid='devex-form-password'
            type='password'
            label={`${translate('Label.Password')}*`}
            className={textField}
            InputProps={{
              endAdornment: errors.password !== undefined && errorIcon,
            }}
            FormHelperTextProps={{ className: helperTextClass }}
            error={errors.password !== undefined}
            helperText={errors.password?.message}
            {...register('password', formValidation.validatePassword)}
          />
        </Grid>
        <Grid item>
          <TextField
            id='robuxAmountId'
            data-testid='devex-form-robux-amount'
            label={`${translate('Label.RobuxAmount')}*`}
            className={textField}
            FormHelperTextProps={{ className: helperTextClass }}
            helperText={
              <Grid container item alignItems='center' justifyContent='space-between'>
                <Grid item data-testid='devex-form-robux-amount-helper'>
                  {errors.robuxAmount?.message ?? (
                    <span className={`${robuxAmountHelperContent} text-body-small`}>
                      <span>
                        {`${translate('Label.RobuxAmountToUSD')}: `}
                        <span className='text-title-small'>
                          {translate('Label.CurrencyAmountUSD', {
                            amount: String(numberFormatter(robuxToUSD ?? 0, 'currency')),
                          })}
                        </span>
                      </span>
                      <button
                        type='button'
                        data-testid='devex-form-robux-rate-summary-toggle'
                        className={robuxRateSummaryToggle}
                        aria-expanded={robuxRateBreakdownExpanded}
                        aria-label={
                          translate(
                            'Action.ToggleCashOutRateBreakdown' /* TranslationNamespace.DevEx */,
                          ) || 'Toggle rate breakdown'
                        }
                        onClick={() => setRobuxRateBreakdownExpanded((open) => !open)}>
                        <ExpandMoreIcon
                          className={`${expandIcon} ${robuxRateBreakdownExpanded ? expandIconExpanded : ''}`}
                        />
                      </button>
                    </span>
                  )}
                </Grid>
                <Grid item>
                  {availableRobux !== undefined && errors.robuxAmount?.message === undefined ? (
                    <div className={`${availableRobuxHelper} text-body-small`}>
                      <span>{translate('Label.AvailableRobux')}</span>
                      {robuxIcon}
                      <span>{availableRobux}</span>
                    </div>
                  ) : (
                    ''
                  )}
                </Grid>
              </Grid>
            }
            InputProps={{
              startAdornment: (
                <div className={robuxAdornment}>
                  <RobuxIcon
                    fontSize='small'
                    className={errors.robuxAmount !== undefined ? robuxError : undefined}
                  />
                </div>
              ),
              endAdornment: errors.robuxAmount !== undefined && errorIcon,
            }}
            inputProps={{
              inputMode: 'numeric',
              pattern: '[0-9]*',
              onInput: (event) => {
                const input = event.currentTarget;
                const sanitizedValue = sanitizeRobuxAmountInput(input.value);
                if (input.value !== sanitizedValue) {
                  input.value = sanitizedValue;
                }
              },
            }}
            error={errors.robuxAmount !== undefined}
            {...robuxAmountRegistration}
          />
          {errors.robuxAmount?.message === undefined ? (
            <Collapse in={robuxRateBreakdownExpanded}>
              <div className={robuxRateBreakdownContainer}>
                <CashOutRobuxRateBreakdown
                  o18Tier={rateBreakdownTiers.o18Tier}
                  r35Tier={rateBreakdownTiers.r35Tier}
                  r38Tier={rateBreakdownTiers.r38Tier}
                  totalRobux={fiatAllocation.totalRobux}
                  totalUsd={fiatAllocation.totalUsd}
                  r38UsdPerRobuxRate={estimate?.robuxAt38ToUsdRate ?? 0}
                />
              </div>
            </Collapse>
          ) : null}
        </Grid>
        {estimate?.shouldDisplayEffectiveO18Robux === true && (
          <Grid item>
            <CashOutPayoutInfoBanner
              className={textField}
              lastUpdated={getCashOutPayoutInfoLastUpdatedLabel(
                locale,
                estimate.lastProcessedTimestamp,
              )}
            />
          </Grid>
        )}
        <Grid item container alignItems='center'>
          <FormControlLabel
            data-testid='devex-form-agree-tos'
            control={<Checkbox color='secondary' {...register('agreeTOS')} />}
            label={translateHTML('Label.AgreeToTermsOfServiceV2', [
              {
                opening: 'TOSLinkStart',
                closing: 'TOSLinkEnd',
                content(chunks) {
                  return (
                    <Link href={getDevexTermsURL(locale)} target='_blank'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ])}
          />
        </Grid>
        {isFirstTimeDevexer() && (
          <Grid item container alignItems='center'>
            <FormControlLabel
              data-testid='devex-form-agree-info'
              control={<Checkbox color='secondary' {...register('agreeInfo')} />}
              label={translate('Label.AgreeToProvideInfoV2')}
            />
          </Grid>
        )}
        <Grid item>
          <Divider />
        </Grid>
        <Grid item container alignItems='center'>
          <Button
            color='primary'
            variant='outlined'
            className={marginRight}
            onClick={onCancelCashout}
            data-testid='devex-form-cancel-button'>
            {translate('Action.Cancel')}
          </Button>
          <Button
            type='submit'
            variant='contained'
            loading={isSubmitting}
            disabled={!enableSubmit()}
            aria-label={translate('Action.CashOut')}
            data-testid='devex-form-submit-button'>
            {translate('Action.CashOut')}
          </Button>
        </Grid>
        {submitErrorCode !== null && (
          <Grid item>
            <Typography color='error' component='p' variant='body1'>
              {getErrorMessage(translate, submitErrorCode)}
            </Typography>
          </Grid>
        )}
      </Grid>
    </form>
  );
};

export default Form;

import {
  type GetPerformanceEstimateResponse,
  PerformanceEstimateRequestType,
} from '@rbx/client-ads-management-api/v1';
import { FormEvent, useCallback, useMemo, useState } from 'react';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import {
  buildPerformanceEstimateRequestBody,
  ForecastDurationValue,
  ForecastFormInputs,
  getEstimateDisplayFromResponse,
  initialForecastFormInputs,
  isForecastDurationContinuous,
  scaleDailyLimitByCampaignDuration,
} from '@components/forecast/ForecastEstimator.utils';
import { TranslationNamespace } from '@constants/localization';
import { appMetadataDefaults } from '@constants/metadata';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { postPerformanceEstimate } from '@services/ads/getPerformanceEstimateService';
import { useAppStore } from '@stores/appStoreProvider';
import { MicroUsdToUsd, UsdToString } from '@utils/currency';

export const useForecastEstimator = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Forecast);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);

  const isForecastEstimatorEnabled = useAppStore(
    (state) => state.appMetadataState?.data?.isForecastEstimatorEnabled ?? false,
  );
  const campaignMinimumDailyBudgetMicroUsd = useAppStore(
    (state) =>
      state.appMetadataState?.data?.campaignMinimumDailyBudgetMicroUsd ??
      appMetadataDefaults.campaignMinimumDailyBudgetMicroUsd,
  );
  const campaignMaximumDailyBudgetMicroUsd = useAppStore(
    (state) =>
      state.appMetadataState?.data?.campaignMaximumDailyBudgetMicroUsd ??
      appMetadataDefaults.campaignMaximumDailyBudgetMicroUsd,
  );
  const campaignMaximumDailyExpectedPlays = useAppStore(
    (state) =>
      state.appMetadataState?.data?.campaignMaximumDailyExpectedPlays ??
      appMetadataDefaults.campaignMaximumDailyExpectedPlays,
  );
  const campaignMinimumDailyExpectedPlays = useAppStore(
    (state) =>
      state.appMetadataState?.data?.campaignMinimumDailyExpectedPlays ??
      appMetadataDefaults.campaignMinimumDailyExpectedPlays,
  );
  const defaultBudgetRecommendationMicroUsd = useAppStore(
    (state) =>
      state.appMetadataState?.data?.defaultBudgetRecommendationMicroUsd ??
      appMetadataDefaults.defaultBudgetRecommendationMicroUsd,
  );

  const [formInputs, setFormInputs] = useState<ForecastFormInputs>(initialForecastFormInputs);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<GetPerformanceEstimateResponse | null>(null);
  const [lastCalculatedWith, setLastCalculatedWith] = useState<'budget' | 'plays' | null>(null);

  const { budgetUsd, durationInDays, plays } = formInputs;

  const budgetHasInput = budgetUsd.trim().length > 0;
  const playsHasInput = plays.trim().length > 0;

  const budgetDisabled = playsHasInput;
  const playsDisabled = budgetHasInput;

  const resetInputs = useCallback(() => {
    setFormInputs((prev) => ({ ...prev, budgetUsd: '', plays: '' }));
    setError('');
    setLastCalculatedWith(null);
  }, []);

  const handleDurationChange = useCallback((value: string) => {
    setFormInputs((prev) => ({
      ...prev,
      budgetUsd: '',
      durationInDays: value as ForecastDurationValue,
      plays: '',
    }));
    setError('');
    setResult(null);
    setLastCalculatedWith(null);
    setLoading(false);
  }, []);

  const runDefaultEstimate = useCallback(async () => {
    setError('');
    const body = buildPerformanceEstimateRequestBody(
      String(MicroUsdToUsd(defaultBudgetRecommendationMicroUsd)),
      '',
      durationInDays,
    );
    try {
      setLoading(true);
      const data = await postPerformanceEstimate(body);
      setResult(data);
      setLastCalculatedWith(null);
    } catch {
      setError(translateMisc('Message.GenericError'));
    } finally {
      setLoading(false);
    }
  }, [defaultBudgetRecommendationMicroUsd, durationInDays, translateMisc]);

  const submitForecast = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      setError('');

      const body = buildPerformanceEstimateRequestBody(budgetUsd, plays, durationInDays);

      if (e) {
        logNativeClickEvent(EventName.ForecastEstimatorDrawerSubmitted, {
          duration: durationInDays,
          ...(body.requestType ===
          PerformanceEstimateRequestType.PerformanceEstimateRequestTypeBudget
            ? { budgetMicroUsd: String(body.budgetMicroUsd) }
            : { plays: String(body.plays) }),
        });
      }

      try {
        setLoading(true);
        const data = await postPerformanceEstimate(body);
        setResult(data);
        setLastCalculatedWith(playsHasInput ? 'plays' : 'budget');
      } catch {
        setError(translateMisc('Message.GenericError'));
      } finally {
        setLoading(false);
      }
    },
    [budgetUsd, durationInDays, plays, playsHasInput, translateMisc],
  );

  const isContinuousDuration = isForecastDurationContinuous(durationInDays);
  const budgetFieldLabel = isContinuousDuration
    ? translate('Label.DailyBudget')
    : translate('Label.TotalBudget');
  const playsFieldLabel = isContinuousDuration
    ? translate('Label.DailyPlays')
    : translate('Label.TotalPlays');

  const estimateDisplay = useMemo(
    () => (result ? getEstimateDisplayFromResponse(result, durationInDays) : null),
    [durationInDays, result],
  );

  const { budgetMaxUsd, budgetMinUsd, playsMax, playsMin } = useMemo(() => {
    const minBudgetMicro = scaleDailyLimitByCampaignDuration(
      campaignMinimumDailyBudgetMicroUsd,
      durationInDays,
    );
    const maxBudgetMicro = scaleDailyLimitByCampaignDuration(
      campaignMaximumDailyBudgetMicroUsd,
      durationInDays,
    );
    return {
      budgetMaxUsd: MicroUsdToUsd(maxBudgetMicro),
      budgetMinUsd: MicroUsdToUsd(minBudgetMicro),
      playsMax: scaleDailyLimitByCampaignDuration(
        campaignMaximumDailyExpectedPlays,
        durationInDays,
      ),
      playsMin: scaleDailyLimitByCampaignDuration(
        campaignMinimumDailyExpectedPlays,
        durationInDays,
      ),
    };
  }, [
    campaignMaximumDailyBudgetMicroUsd,
    campaignMaximumDailyExpectedPlays,
    campaignMinimumDailyBudgetMicroUsd,
    campaignMinimumDailyExpectedPlays,
    durationInDays,
  ]);

  const { budgetFieldError, playsFieldError } = useMemo(() => {
    let budget: string | undefined;
    if (budgetHasInput && !budgetDisabled) {
      const usd = Number.parseFloat(budgetUsd.trim());
      if (Number.isFinite(usd)) {
        if (usd < budgetMinUsd) {
          budget = translate('Validation.ForecastBudgetMin', { amount: UsdToString(budgetMinUsd) });
        } else if (usd > budgetMaxUsd) {
          budget = translate('Validation.ForecastBudgetMax', { amount: UsdToString(budgetMaxUsd) });
        }
      }
    }

    let playsErr: string | undefined;
    if (playsHasInput && !playsDisabled) {
      const playsNum = Number(plays.trim());
      if (!Number.isFinite(playsNum) || playsNum < playsMin) {
        playsErr = translate('Validation.ForecastPlaysMin', { amount: String(playsMin) });
      } else if (playsNum > playsMax) {
        playsErr = translate('Validation.ForecastPlaysMax', { amount: String(playsMax) });
      }
    }
    return { budgetFieldError: budget, playsFieldError: playsErr };
  }, [
    budgetDisabled,
    budgetHasInput,
    budgetMaxUsd,
    budgetMinUsd,
    budgetUsd,
    plays,
    playsDisabled,
    playsHasInput,
    playsMax,
    playsMin,
    translate,
  ]);

  const hasFieldValidationError = Boolean(budgetFieldError || playsFieldError);

  const showLifetimeEstimatedResultsLayout =
    estimateDisplay?.isContinuous === false || (!estimateDisplay && !isContinuousDuration);

  const calculatedPlays =
    budgetHasInput && lastCalculatedWith === 'budget' && estimateDisplay
      ? String(estimateDisplay.primaryPlays)
      : '';
  const calculatedBudgetUsd =
    playsHasInput && lastCalculatedWith === 'plays' && estimateDisplay
      ? String(MicroUsdToUsd(estimateDisplay.primaryBudgetMicroUsd))
      : '';

  return {
    budgetFieldError,
    budgetFieldLabel,
    budgetHasInput,
    budgetUsd,
    calculatedBudgetUsd,
    calculatedPlays,
    durationInDays,
    error,
    estimateDisplay,
    handleDurationChange,
    hasFieldValidationError,
    isForecastEstimatorEnabled,
    loading,
    plays,
    playsFieldError,
    playsFieldLabel,
    playsHasInput,
    resetInputs,
    result,
    runDefaultEstimate,
    setFormInputs,
    showLifetimeEstimatedResultsLayout,
    submitForecast,
  };
};

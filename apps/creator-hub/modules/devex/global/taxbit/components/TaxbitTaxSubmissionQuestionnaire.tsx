import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TaxbitQuestionnaire } from '@taxbit/react-sdk';
import type { Locale as TaxbitLocale } from '@taxbit/react-sdk';
import { Locale as RobloxLocale, useLocalization } from '@rbx/intl';
import TaxesLoading from '../../taxes/components/TaxesLoading';
import {
  mapTaxbitProgressToTaxFlowStep,
  type TaxFlowStep,
  type TaxStepDirection,
} from '../../taxes/utils/taxTelemetry';
import TaxbitHelpCenter, { type TaxbitProgress } from './TaxbitHelpCenter';
import styles from './TaxbitTaxSubmissionQuestionnaire.module.css';

const ENABLE_TREATY_CLAIMS = true;

export type TaxbitTaxSubmissionQuestionnaireProps = {
  adaptiveMode?: 'skipEdit';
  bearerToken: string;
  loadingLabel: string;
  onError: (error: Error) => void;
  onReady: () => void;
  onStepViewed: (step: TaxFlowStep, direction: TaxStepDirection) => void;
  onSuccess: () => void;
};

const DEFAULT_TAXBIT_LOCALE: TaxbitLocale = 'en-us';

const ROBLOX_TO_TAXBIT_LOCALE_MAP: Partial<Record<RobloxLocale, TaxbitLocale>> = {
  [RobloxLocale.English]: 'en-us',
  [RobloxLocale.Spanish]: 'es-mx',
  [RobloxLocale.French]: 'fr-ca',
  [RobloxLocale.German]: 'de',
  [RobloxLocale.Italian]: 'it',
  [RobloxLocale.BrazilPortuguese]: 'pt-br',
  [RobloxLocale.Korean]: 'ko',
  [RobloxLocale.SimplifiedChinese]: 'zh-cn',
  [RobloxLocale.SimplifiedChineseJV]: 'zh-cn',
  [RobloxLocale.TraditionalChinese]: 'zh-tw',
  [RobloxLocale.Japanese]: 'ja',
  [RobloxLocale.Russian]: 'ru',
  [RobloxLocale.Indonesian]: 'id',
  [RobloxLocale.Polish]: 'pl',
  [RobloxLocale.Vietnamese]: 'vi',
  [RobloxLocale.Turkish]: 'tr',
  [RobloxLocale.Thai]: 'th',
};

export const getTaxbitLocale = (locale: RobloxLocale | null): TaxbitLocale =>
  locale ? (ROBLOX_TO_TAXBIT_LOCALE_MAP[locale] ?? DEFAULT_TAXBIT_LOCALE) : DEFAULT_TAXBIT_LOCALE;

type TaxbitLoadingSentinelProps = {
  onLoadingComplete: () => void;
};

export const TaxbitLoadingSentinel: FunctionComponent<TaxbitLoadingSentinelProps> = ({
  onLoadingComplete,
}) => {
  useEffect(
    () => () => {
      // The SDK unmounts its loading component when the questionnaire is ready.
      onLoadingComplete();
    },
    [onLoadingComplete],
  );

  return null;
};

const TaxbitTaxSubmissionQuestionnaire: FunctionComponent<
  TaxbitTaxSubmissionQuestionnaireProps
> = ({ adaptiveMode, bearerToken, loadingLabel, onError, onReady, onStepViewed, onSuccess }) => {
  const { locale } = useLocalization();
  const [isSdkLoading, setIsSdkLoading] = useState(true);
  const [progress, setProgress] = useState<TaxbitProgress | null>(null);
  const hasHandledSubmission = useRef(false);
  const hasSubmissionError = useRef(false);
  const lastViewedProgress = useRef<TaxbitProgress | null>(null);

  const handleSdkLoadingComplete = useCallback(() => {
    setIsSdkLoading(false);
    onReady();
  }, [onReady]);

  const handleSuccess = useCallback(() => {
    if (hasHandledSubmission.current) {
      return;
    }

    hasHandledSubmission.current = true;
    onSuccess();
  }, [onSuccess]);

  const handleError = useCallback(
    (error: Error) => {
      hasSubmissionError.current = true;
      onError(error);
    },
    [onError],
  );

  const handleSettled = useCallback(() => {
    if (!hasSubmissionError.current) {
      handleSuccess();
    }
  }, [handleSuccess]);

  const handleProgress = useCallback(
    (nextProgress: TaxbitProgress) => {
      setProgress(nextProgress);
      const step = mapTaxbitProgressToTaxFlowStep(nextProgress);
      const previousProgress = lastViewedProgress.current;
      if (nextProgress.stepId === previousProgress?.stepId) {
        return;
      }

      let direction: TaxStepDirection = 'initial';
      if (previousProgress) {
        const previousIndex = nextProgress.steps.indexOf(previousProgress.stepId);
        const nextIndex = nextProgress.steps.indexOf(nextProgress.stepId);
        if (previousIndex >= 0 && nextIndex >= 0) {
          direction = nextIndex > previousIndex ? 'next' : 'previous';
        }
      }

      lastViewedProgress.current = nextProgress;
      onStepViewed(step, direction);
    },
    [onStepViewed],
  );

  return (
    <div className={styles.root}>
      {isSdkLoading && <TaxesLoading context='taxbit' label={loadingLabel} />}
      <div className={isSdkLoading ? styles.sdkLoading : undefined}>
        {!isSdkLoading && <TaxbitHelpCenter progress={progress} />}
        <TaxbitQuestionnaire
          adaptiveMode={adaptiveMode}
          bearerToken={bearerToken}
          language={getTaxbitLocale(locale)}
          loadingComponent={<TaxbitLoadingSentinel onLoadingComplete={handleSdkLoadingComplete} />}
          onError={handleError}
          onProgress={handleProgress}
          onSettled={handleSettled}
          onSuccess={handleSuccess}
          prepopulateWithSavedData={false}
          questionnaire='W-FORM'
          treatyClaims={ENABLE_TREATY_CLAIMS}
        />
      </div>
    </div>
  );
};

export default TaxbitTaxSubmissionQuestionnaire;

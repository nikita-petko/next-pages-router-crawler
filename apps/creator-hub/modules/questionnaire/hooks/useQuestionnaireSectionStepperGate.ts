import type { FunctionComponent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  ContentSuitabilityQuestionnaireParameters,
  fetchIXPParametersForCurrentUser,
  IXPLayers,
} from '@modules/clients/ixpExperiments';
import {
  getValueFromStorage,
  writeValueToStorage,
} from '@modules/miscellaneous/hooks/useIXPParameters';

export type TQuestionnaireSectionStepperGate = {
  isSectionStepperEnabled: boolean;
  isFetched: boolean;
};

/** Dev-only override. In the browser console: localStorage.setItem(DEV_KEY, 'true') */
export const QUESTIONNAIRE_SECTION_STEPPER_IXP_OVERRIDE_KEY = 'dev:questionnaireSectionStepperIxp';

const isIxpStepperTreatmentValue = (value: unknown): boolean => value === true || value === 1;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isIxpStepperTreatment = (
  params: Partial<Record<ContentSuitabilityQuestionnaireParameters, boolean | number | null>>,
): boolean =>
  isIxpStepperTreatmentValue(
    params[ContentSuitabilityQuestionnaireParameters.EnableSectionStepper],
  );

const isIxpStepperTreatmentFromUnknown = (params: unknown): boolean => {
  if (!isRecord(params)) {
    return false;
  }

  return isIxpStepperTreatmentValue(
    params[ContentSuitabilityQuestionnaireParameters.EnableSectionStepper],
  );
};

const readDevStepperIxpOverride = (): boolean | null => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  try {
    const value = window.localStorage.getItem(QUESTIONNAIRE_SECTION_STEPPER_IXP_OVERRIDE_KEY);
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
  } catch {
    // ignore localStorage errors
  }

  return null;
};

const getInitialSectionStepperGate = (): {
  isSectionStepperEnabled: boolean;
  isFetched: boolean;
  skipIxpFetch: boolean;
} => {
  const devOverride = readDevStepperIxpOverride();
  if (devOverride !== null) {
    return {
      isSectionStepperEnabled: devOverride,
      isFetched: true,
      skipIxpFetch: true,
    };
  }

  return {
    isSectionStepperEnabled: false,
    isFetched: false,
    skipIxpFetch: false,
  };
};

/**
 * IXP assignment for the v1 section stepper experiment.
 *
 * Enrollment is automatic: fetching the layer from PEP logs the access event.
 * Mount `QuestionnaireSectionStepperIxpEnrollment` only for fresh attempts.
 *
 * Requires PEP layer `ContentSuitability.Questionnaire.UserId` with parameter
 * `enableSectionStepper` (see docs/EXPERIMENTATION.md).
 */
const useQuestionnaireSectionStepperGate = (): TQuestionnaireSectionStepperGate => {
  const [initialGate] = useState(getInitialSectionStepperGate);
  const [isSectionStepperEnabled, setIsSectionStepperEnabled] = useState(
    initialGate.isSectionStepperEnabled,
  );
  const [isFetched, setIsFetched] = useState(initialGate.isFetched);

  useEffect(() => {
    if (initialGate.skipIxpFetch) {
      return undefined;
    }

    let cancelled = false;

    void fetchIXPParametersForCurrentUser(IXPLayers.ContentSuitabilityQuestionnaire)
      .then((params) => {
        if (cancelled) {
          return;
        }
        writeValueToStorage(IXPLayers.ContentSuitabilityQuestionnaire, params);
        setIsSectionStepperEnabled(isIxpStepperTreatment(params));
        setIsFetched(true);
      })
      .catch(() => {
        if (!cancelled) {
          setIsSectionStepperEnabled(false);
          setIsFetched(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialGate.skipIxpFetch]);

  return { isSectionStepperEnabled, isFetched };
};

/** Fetches IXP when mounted. Container mounts this only for fresh attempts. */
export const QuestionnaireSectionStepperIxpEnrollment: FunctionComponent<{
  children: (gate: TQuestionnaireSectionStepperGate) => ReactNode;
}> = ({ children }) => {
  const gate = useQuestionnaireSectionStepperGate();
  return children(gate);
};

export const readSectionStepperGateFromCache = (): TQuestionnaireSectionStepperGate => {
  const devOverride = readDevStepperIxpOverride();
  if (devOverride !== null) {
    return {
      isSectionStepperEnabled: devOverride,
      isFetched: true,
    };
  }

  const params: unknown = getValueFromStorage(IXPLayers.ContentSuitabilityQuestionnaire);
  return {
    isSectionStepperEnabled: isIxpStepperTreatmentFromUnknown(params),
    isFetched: true,
  };
};

/** Reads cached IXP only (no fetch / enrollment). Container mounts this for resume. */
export const QuestionnaireSectionStepperIxpCache: FunctionComponent<{
  children: (gate: TQuestionnaireSectionStepperGate) => ReactNode;
}> = ({ children }) => {
  const [gate] = useState(readSectionStepperGateFromCache);
  return children(gate);
};

export default useQuestionnaireSectionStepperGate;

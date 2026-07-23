import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Button, Grid, Typography } from '@rbx/ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PageLoading } from '@modules/miscellaneous/common';
import experienceGuidelinesServiceApiClient, {
  GetDetailedGuidelinesResponse,
} from '@modules/clients/experienceGuidelinesService';
import { RestrictedCountry } from '@rbx/clients/experienceQuestionnaire/v1';
import {
  V1Beta1Moderation as Moderation,
  V1Beta1ExperienceDescriptor as ExperienceDescriptor,
  V1Beta1ModerationStatus as ModerationStatus,
  V1Beta1CreatorOverrides as CreatorOverrides,
} from '@rbx/clients/experienceGuidelinesService';
import QuestionnaireSubmissionState from './SubmissionState';
import useQuestionnaireToast from '../hooks/useQuestionnaireToast';
import useQuestionnaireProgressStyles from './QuestionnaireProgress.styles';
import useExperienceGuidelinesStyles from '../containers/ExperienceGuidelines.styles';
import { TranslationKeys } from '../interfaces/types';
import {
  GUIDELINES_TRANSLATION_KEYS,
  CONTENT_MATURITY_TRANSLATION_KEYS,
  PROGRESS_STATES,
} from '../constants/questionnaireConstants';
import networkRequestManager from '../implementations/QuestionnaireNetworkRequestManager';
import ExperienceGuidelinesTables from '../containers/ExperienceGuidelinesTables';
import {
  extractAgeDisplayNameFromEGS,
  extractExperienceDescriptorsFromEGSAgeRecommendation,
  convertRestrictedCountries,
} from '../utils/experienceRestrictionsUtils';
import QuestionnaireProgressCommonText from './QuestionnaireProgressCommonText';
import ModerationInformation from './ModerationInformation';

export interface QuestionnaireProgressProps {
  onClick: () => void;
  universeId: number;
  progressState: 'submitted' | 'started' | 'not_started';
  submissionState: QuestionnaireSubmissionState;
  isContentMaturityEnabled: boolean;
  isIncreaseMaturityEnabled: boolean;
}

const QuestionnaireProgress: FunctionComponent<
  React.PropsWithChildren<QuestionnaireProgressProps>
> = ({
  onClick,
  universeId,
  progressState,
  submissionState,
  isContentMaturityEnabled,
  isIncreaseMaturityEnabled,
}) => {
  const { translate, translateHTML } = useTranslation();
  const {
    classes: { title, message, button },
  } = useQuestionnaireProgressStyles();
  const { showToastNetworkError, showToastUserError } = useQuestionnaireToast();
  const {
    classes: { mainGrid },
  } = useExperienceGuidelinesStyles();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [ageContentDescriptors, setAgeContentDescriptors] = useState<ExperienceDescriptor[]>([]);
  const [ageDisplay, setAgeDisplay] = useState<string | null>(null);
  const [restrictedCountries, setRestrictedCountries] = useState<RestrictedCountry[]>([]);
  const [moderation, setModeration] = useState<Moderation | null>(null);
  const [creatorOverrides, setCreatorOverrides] = useState<CreatorOverrides | null>(null);
  const [submitBy, setSubmitBy] = useState<string | null>(null);

  // TODO (UCS-719): Remove PROGRESS_STATES.SUBMITTED when we fully depend on UCS-719
  const getTranslationKeysGuidelines = (): TranslationKeys => {
    // Progress state refers to wheter or not a questionnaire submission is in progress when guidelines is enabled
    // and it refers to submission in progress and submitted states when guidelines is disabled
    // submission state solely tries to understand the versioning of a questionnaire and which one was last answered
    // and if thats the most recent version

    if (progressState === PROGRESS_STATES.STARTED) {
      // For the case where guidelines are active and a new submission is still in progress
      if (submissionState === QuestionnaireSubmissionState.SubmittedCurrentVersion) {
        return {
          ...GUIDELINES_TRANSLATION_KEYS.SUBMITTED_NEW_VERSION_STARTED,
        };
      }
      return {
        ...GUIDELINES_TRANSLATION_KEYS.STARTED,
      };
    }
    if (submissionState === QuestionnaireSubmissionState.SubmittedNone) {
      return {
        ...GUIDELINES_TRANSLATION_KEYS.NOT_STARTED,
      };
    }
    if (submissionState === QuestionnaireSubmissionState.SubmittedOldVersion) {
      return {
        ...GUIDELINES_TRANSLATION_KEYS.SUBMITTED_OLD_VERSION,
      };
    }
    return {
      ...GUIDELINES_TRANSLATION_KEYS.SUBMITTED_NEW_VERSION,
    };
  };

  const getTranslationKeysMaturity = (): TranslationKeys => {
    // Progress state refers to wheter or not a questionnaire submission is in progress when guidelines is enabled
    // and it refers to submission in progress and submitted states when guidelines is disabled
    // submission state solely tries to understand the versioning of a questionnaire and which one was last answered
    // and if thats the most recent version

    if (progressState === PROGRESS_STATES.STARTED) {
      // For the case where guidelines are active and a new submission is still in progress
      if (submissionState === QuestionnaireSubmissionState.SubmittedCurrentVersion) {
        return {
          ...CONTENT_MATURITY_TRANSLATION_KEYS.SUBMITTED_NEW_VERSION_STARTED,
        };
      }
      return {
        ...CONTENT_MATURITY_TRANSLATION_KEYS.STARTED,
      };
    }
    if (submissionState === QuestionnaireSubmissionState.SubmittedNone) {
      return {
        ...CONTENT_MATURITY_TRANSLATION_KEYS.NOT_STARTED,
      };
    }
    if (submissionState === QuestionnaireSubmissionState.SubmittedOldVersion) {
      return {
        ...CONTENT_MATURITY_TRANSLATION_KEYS.SUBMITTED_OLD_VERSION,
      };
    }
    return {
      ...CONTENT_MATURITY_TRANSLATION_KEYS.SUBMITTED_NEW_VERSION,
    };
  };

  const translationKeys = isContentMaturityEnabled
    ? getTranslationKeysMaturity()
    : getTranslationKeysGuidelines();

  const attemptGetComplianceRestrictions = useCallback(async () => {
    try {
      const getDetailedGuidelinesResponse =
        await networkRequestManager.attemptNetworkRequestWithRetry<GetDetailedGuidelinesResponse>(
          () => experienceGuidelinesServiceApiClient.getDetailedGuidelines(universeId),
        );

      setCreatorOverrides(getDetailedGuidelinesResponse.creatorOverrides ?? null);
      setSubmitBy(getDetailedGuidelinesResponse.submitBy ?? null);
      setModeration(getDetailedGuidelinesResponse.moderation ?? null);

      const ageRecommendationFound = getDetailedGuidelinesResponse.ageRecommendationDetails ?? null;
      setAgeDisplay(extractAgeDisplayNameFromEGS(ageRecommendationFound));
      setAgeContentDescriptors(
        extractExperienceDescriptorsFromEGSAgeRecommendation(ageRecommendationFound),
      );

      const restrictedCountriesFound = getDetailedGuidelinesResponse.restrictedCountries ?? [];
      setRestrictedCountries(convertRestrictedCountries(restrictedCountriesFound));
    } catch (e) {
      networkRequestManager.handleNetworkRequestFailure(
        e,
        showToastUserError,
        showToastNetworkError,
      );
    }
  }, [universeId, showToastNetworkError, showToastUserError]);

  useEffect(() => {
    // Should run once at beginning to call a series of network requests gathering preview data
    async function beginFetchData() {
      setIsLoading(true);
      try {
        await attemptGetComplianceRestrictions();
      } finally {
        setIsLoading(false);
      }
    }
    beginFetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run once on load
  }, []);

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <section>
      <Grid container direction='column' className={mainGrid}>
        <Grid item className={title}>
          <Typography variant='h2'>
            {moderation?.moderationStatus === ModerationStatus.Rejected
              ? translateHTML(GUIDELINES_TRANSLATION_KEYS.SUBMITTED_REJECTED.titleKey, [
                  {
                    opening: 'redColorStart',
                    closing: 'redColorEnd',
                    content(chunks) {
                      return (
                        <Typography variant='h2' color='error'>
                          {chunks}
                        </Typography>
                      );
                    },
                  },
                ])
              : translate(translationKeys.titleKey)}
          </Typography>
        </Grid>
        {moderation?.moderationStatus === ModerationStatus.Rejected && (
          <Grid item className={message}>
            <ModerationInformation
              submitBy={submitBy ?? ''}
              moderation={moderation}
              isContentMaturityEnabled={isContentMaturityEnabled}
            />
          </Grid>
        )}
        <Grid item className={message}>
          <QuestionnaireProgressCommonText
            messageKey={translationKeys.messageKey}
            isContentMaturityEnabled={isContentMaturityEnabled}
          />
        </Grid>
        <ExperienceGuidelinesTables
          universeId={universeId}
          restrictedCountries={restrictedCountries}
          ageDisplay={ageDisplay}
          ageContentDescriptors={ageContentDescriptors}
          creatorOverrides={creatorOverrides}
          isContentMaturityEnabled={isContentMaturityEnabled}
          isIncreaseMaturityEnabled={isIncreaseMaturityEnabled}
        />
        <Grid item className={button}>
          <Button onClick={onClick} variant='contained' color='primaryBrand' size='large'>
            {translate(translationKeys.buttonKey)}
          </Button>
        </Grid>
      </Grid>
    </section>
  );
};

export default withTranslation(QuestionnaireProgress, [
  TranslationNamespace.DeveloperQuestionnaire,
]);

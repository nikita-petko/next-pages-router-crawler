import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { V1Beta1ModerationStatus as ModerationStatus } from '@rbx/client-experience-guidelines-service/v1';
import { withTranslation, useTranslation } from '@rbx/intl';
import { Button, Grid, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  GUIDELINES_TRANSLATION_KEYS,
  CONTENT_MATURITY_TRANSLATION_KEYS,
  PROGRESS_STATES,
} from '../constants/questionnaireConstants';
import useExperienceGuidelinesStyles from '../containers/ExperienceGuidelines.styles';
import ExperienceGuidelinesTables from '../containers/ExperienceGuidelinesTables';
import useQuestionnaireErrorToast from '../hooks/useQuestionnaireErrorToast';
import type { TranslationKeys } from '../interfaces/types';
import {
  extractAgeDisplayNameFromEGS,
  extractExperienceDescriptorsFromEGSAgeRecommendation,
  convertRestrictedCountries,
} from '../utils/experienceRestrictionsUtils';
import { useDetailedGuidelines } from '../utils/queries';
import ModerationInformation from './ModerationInformation';
import useQuestionnaireProgressStyles from './QuestionnaireProgress.styles';
import QuestionnaireProgressCommonText from './QuestionnaireProgressCommonText';
import QuestionnaireSubmissionState from './SubmissionState';

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
  const {
    classes: { mainGrid },
  } = useExperienceGuidelinesStyles();
  // `QuestionnaireContainer` awaits this same query in its gate, so this is cache-warm on mount.
  // Deliberately no loading branch here — that would put a second spinner on the page.
  const { data: guidelines, error } = useDetailedGuidelines(universeId);
  useQuestionnaireErrorToast(error);

  const creatorOverrides = guidelines?.creatorOverrides ?? null;
  const submitBy = guidelines?.submitBy ?? null;
  const moderation = guidelines?.moderation ?? null;

  // Memoised because the extractors build fresh objects, and these are props on a subtree.
  const { ageDisplay, ageContentDescriptors, restrictedCountries } = useMemo(() => {
    const ageRecommendation = guidelines?.ageRecommendationDetails ?? null;
    return {
      ageDisplay: extractAgeDisplayNameFromEGS(ageRecommendation),
      ageContentDescriptors:
        extractExperienceDescriptorsFromEGSAgeRecommendation(ageRecommendation),
      restrictedCountries: convertRestrictedCountries(guidelines?.restrictedCountries ?? []),
    };
  }, [guidelines]);

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

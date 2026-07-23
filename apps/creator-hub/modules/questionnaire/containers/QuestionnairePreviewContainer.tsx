import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import type {
  V1Beta1ExperienceDescriptor as ExperienceGuidelinesDescriptor,
  V1Beta1GetDetailedGuidelinesResponse,
  V1Beta1CreatorOverrides as CreatorOverrides,
} from '@rbx/client-experience-guidelines-service/v1';
import type {
  Response,
  PreviewSubmissionResponse,
  RestrictedCountry,
} from '@rbx/client-experience-questionnaire/v1';
import { useTranslation, useLocalization } from '@rbx/intl';
import { Alert, Button, Dialog, DialogTemplate, Grid, Typography } from '@rbx/ui';
import experienceGuidelinesClient from '@modules/clients/experienceGuidelinesService';
import experienceQuestionnaireClient from '@modules/clients/experienceQuestionnaire';
import { PageLoading } from '@modules/miscellaneous/components';
import QuestionnairePreviewCommonText from '../components/QuestionnairePreviewCommonText';
import useQuestionnaireProgressStyles from '../components/QuestionnaireProgress.styles';
import SeventeenPlusRestrictedCountriesText from '../components/SeventeenPlusRestrictedCountriesText';
import useQuestionnaireToast from '../hooks/useQuestionnaireToast';
import networkRequestManager from '../implementations/QuestionnaireNetworkRequestManager';
import useMarkdownParser from '../parser/useMarkdownParser';
import {
  extractExperienceDescriptorsFromEQSAgeRecommendation,
  extractAgeDisplayNameFromEQS,
} from '../utils/experienceRestrictionsUtils';
import convertToRobloxLocale from '../utils/localizationHelper';
import useExperienceGuidelinesStyles from './ExperienceGuidelines.styles';
import ExperienceGuidelinesTables from './ExperienceGuidelinesTables';
import useQuestionnaireStyles from './QuestionnaireContainer.styles';

export interface QuestionnairePreviewContainerProps {
  universeId: number;
  questionnaireId: string;
  questionnaireResponse: Response;
  onEdit: () => void;
  attemptSubmit: () => void;
  isSaving: boolean;
  moveBackAScreen: () => void;
  isContentMaturityEnabled: boolean;
  isIncreaseMaturityEnabled: boolean;
  enableContentMaturity18Plus: boolean;
}

const QuestionnairePreviewContainer: FunctionComponent<
  React.PropsWithChildren<QuestionnairePreviewContainerProps>
> = ({
  universeId,
  questionnaireId,
  questionnaireResponse,
  onEdit,
  attemptSubmit,
  isSaving,
  moveBackAScreen,
  isContentMaturityEnabled,
  isIncreaseMaturityEnabled,
  enableContentMaturity18Plus,
}) => {
  const { parseText } = useMarkdownParser();
  const { translate } = useTranslation();
  const {
    classes: { navigationButtons, navigationButtonsContainer },
  } = useQuestionnaireStyles();
  const {
    classes: { sectionLabel, mainGrid },
  } = useExperienceGuidelinesStyles();
  const {
    classes: { message },
  } = useQuestionnaireProgressStyles();
  const { showToastNetworkError, showToastUserError } = useQuestionnaireToast();
  const { locale } = useLocalization();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState<boolean>(false);
  const [previewInfoMessage, setPreviewInfoMessage] = useState<string>();
  const [previewWarningMessage, setPreviewWarningMessage] = useState<string>();
  const [previewErrorMessage, setPreviewErrorMessage] = useState<string>();

  const [ageContentDescriptors, setAgeContentDescriptors] = useState<
    ExperienceGuidelinesDescriptor[]
  >([]);
  const [ageDisplay, setAgeDisplay] = useState<string | null>(null);
  const [minimumAge, setMinimumAge] = useState<number | null>(null);
  const [currentAge, setCurrentAge] = useState<number | null>(null);
  const [restrictedCountries, setRestrictedCountries] = useState<RestrictedCountry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const [creatorOverrides, setCreatorOverrides] = useState<CreatorOverrides | null>(null);

  const getAndSetCurrentGuidelines = useCallback(async () => {
    try {
      const currentDetailedGuidelines =
        await networkRequestManager.attemptNetworkRequestWithRetry<V1Beta1GetDetailedGuidelinesResponse>(
          () => experienceGuidelinesClient.getDetailedGuidelines(universeId),
        );

      setCurrentAge(
        currentDetailedGuidelines.ageRecommendationDetails?.ageRecommendationSummary
          ?.ageRecommendation?.minimumAge ?? null,
      );

      setCreatorOverrides(currentDetailedGuidelines.creatorOverrides ?? null);
    } catch {
      throw new Error(
        `Unable to get current guidelines, defaulting to null which will trigger confirmation.`,
      );
    }
  }, [universeId]);

  const attemptGetQuestionnairePreview = useCallback(
    async (localQuestionnaireResponse: Response) => {
      try {
        const localeCode = convertToRobloxLocale(locale);
        const previewResponseObj =
          await networkRequestManager.attemptNetworkRequestWithRetry<PreviewSubmissionResponse>(
            () =>
              experienceQuestionnaireClient.getSubmissionPreview(
                universeId,
                questionnaireId,
                localQuestionnaireResponse,
                localeCode,
              ),
          );

        setRestrictedCountries(previewResponseObj?.restrictedCountries || []);

        const ageRecommendationDetailsFound = previewResponseObj.ageRecommendationDetails ?? null;
        setAgeContentDescriptors(
          extractExperienceDescriptorsFromEQSAgeRecommendation(ageRecommendationDetailsFound),
        );
        setAgeDisplay(extractAgeDisplayNameFromEQS(ageRecommendationDetailsFound));
        setMinimumAge(
          ageRecommendationDetailsFound?.summary?.ageRecommendation?.minimumAge || null,
        );

        await getAndSetCurrentGuidelines();

        if (previewResponseObj.userErrorMessage) {
          setPreviewErrorMessage(previewResponseObj.userErrorMessage);
        }

        if (previewResponseObj.userWarningMessage) {
          setPreviewWarningMessage(previewResponseObj.userWarningMessage);
        }

        if (previewResponseObj.userInfoMessage) {
          setPreviewInfoMessage(previewResponseObj.userInfoMessage);
        }

        if (previewResponseObj.disableSubmitButton) {
          setIsSubmitDisabled(true);
        }
      } catch (e) {
        moveBackAScreen();
        networkRequestManager.handleNetworkRequestFailure(
          e,
          showToastUserError,
          showToastNetworkError,
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE(jcountryman, 2/6/24): Turned off to check in code. Codeowners is responsible for triaging issue.
    [
      universeId,
      questionnaireId,
      getAndSetCurrentGuidelines,
      showToastNetworkError,
      showToastUserError,
    ],
  );

  const toggleDialog = useCallback(
    (event?: React.MouseEvent<HTMLButtonElement>) => {
      if (event) {
        event.preventDefault();
      }

      // Check if we're moving to Restricted (18+), bug fix for UCS-2219
      if (minimumAge === 18 && currentAge !== 18) {
        setIsDialogOpen(!isDialogOpen);
      } else {
        attemptSubmit();
      }
    },
    [attemptSubmit, currentAge, isDialogOpen, minimumAge],
  );

  const onConfirmButton = useCallback(
    (event?: React.MouseEvent<HTMLButtonElement>) => {
      if (event) {
        event.preventDefault();
      }
      attemptSubmit();
      setIsDialogOpen(!isDialogOpen);
    },
    [attemptSubmit, isDialogOpen],
  );

  useEffect(() => {
    // Should run once at beginning to call a series of network requests gathering preview data
    async function beginFetchData() {
      setIsLoading(true);
      await attemptGetQuestionnairePreview(questionnaireResponse);
      setIsLoading(false);
    }
    // This effect is only intended to be triggered when the subpage is first
    // loaded with a new response. However, with a new change to force the
    // landing to update whenever we save/submit a new response to the server,
    // this code is also triggered on submit. This check prevents that from
    // happening, which also prevents a 400 error toast.
    if (!isSaving) {
      beginFetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE(jcountryman, 2/6/24): Turned off to check in code. Codeowners is responsible for triaging issue.
  }, [JSON.stringify(questionnaireResponse), attemptGetQuestionnairePreview]);

  if (isLoading) {
    return <PageLoading />;
  }

  const getContentMessage = () => {
    if (!isContentMaturityEnabled) {
      return 'This experience will become accessible to only age-verified 17+ users. The age recommendation of “Ages 17+” cannot be removed.';
    }
    return enableContentMaturity18Plus
      ? translate('Message.RestrictedLabelWarningAge18Plus')
      : translate('Message.RestrictedLabelWarning');
  };

  return (
    <section>
      <Grid container direction='column' className={mainGrid}>
        <Grid item className={message}>
          <>
            <Typography variant='h2' className={sectionLabel}>
              {translate('Title.GuidelinesPreview')}
            </Typography>
            <QuestionnairePreviewCommonText isContentMaturityEnabled={isContentMaturityEnabled} />
            {previewInfoMessage && (
              <Grid item className={message}>
                <Alert severity='info' variant='standard'>
                  <Typography>{parseText(previewInfoMessage)}</Typography>
                </Alert>
              </Grid>
            )}
            <ExperienceGuidelinesTables
              universeId={universeId}
              restrictedCountries={restrictedCountries}
              ageDisplay={ageDisplay}
              ageContentDescriptors={ageContentDescriptors}
              creatorOverrides={creatorOverrides as CreatorOverrides}
              isContentMaturityEnabled={isContentMaturityEnabled}
              isIncreaseMaturityEnabled={isIncreaseMaturityEnabled}
            />
          </>
        </Grid>
        {minimumAge === 18 && ( // Bug fix for UCS-2219
          <Grid item className={message}>
            <SeventeenPlusRestrictedCountriesText
              isContentMaturityEnabled={isContentMaturityEnabled}
            />
          </Grid>
        )}
        {previewErrorMessage && (
          <Grid item className={message}>
            <Alert severity='error' variant='standard'>
              <Typography>{parseText(previewErrorMessage)}</Typography>
            </Alert>
          </Grid>
        )}
        {previewWarningMessage && (
          <Grid item className={message}>
            <Alert severity='warning' variant='standard'>
              <Typography>{parseText(previewWarningMessage)}</Typography>
            </Alert>
          </Grid>
        )}
        <Grid container direction='row' className={navigationButtonsContainer}>
          <Grid item className={navigationButtons}>
            <Button
              disabled={isSubmitDisabled}
              onClick={(e) => toggleDialog(e)}
              variant='contained'
              color='primaryBrand'
              size='large'
              loading={isSaving}>
              {translate('Button.Submit')}
            </Button>
          </Grid>
          <Grid item className={navigationButtons}>
            <Button onClick={onEdit} variant='contained' color='primary' size='large'>
              {translate('Button.Edit')}
            </Button>
          </Grid>
        </Grid>
        <Dialog onClose={() => toggleDialog()} open={isDialogOpen}>
          <DialogTemplate
            cancelText='Cancel'
            color='primaryBrand'
            confirmText={
              isContentMaturityEnabled
                ? translate('Message.ConfirmRestrictedLabel')
                : 'Yes, make experience ages 17+'
            }
            content={getContentMessage()}
            onCancel={(e) => toggleDialog(e)}
            onConfirm={(e) => onConfirmButton(e)}
            title={
              isContentMaturityEnabled
                ? translate('Title.ConfirmRestrictedLabel')
                : 'Make experience Ages 17+?'
            }
            variant='alert'
          />
        </Dialog>
      </Grid>
    </section>
  );
};

export default QuestionnairePreviewContainer;

import type { UseMutationOptions } from '@tanstack/react-query';
import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ValidateResponseResponse } from '@rbx/client-experience-questionnaire/v1';
import { StatusCodes } from '@rbx/core';
import experienceGuidelinesServiceApiClient from '@modules/clients/experienceGuidelinesService';
import type {
  GetDetailedGuidelinesResponse,
  GetDetailedGuidelinesResponseV2,
} from '@modules/clients/experienceGuidelinesService';
import experienceQuestionnaireClient, {
  experienceQuestionnaireV2Client,
  type GetLatestAdditionalSubmissionResponse,
  type PreviewSubmissionsResponse,
  type SubmitResponseResponse,
  type SubmitResponseResponseV2,
} from '@modules/clients/experienceQuestionnaire';
import iarcActivityServiceClient from '@modules/clients/iarcActivityService';
import { getResponseFromError } from '@modules/clients/utils';
import type { ValidatedAnswer, ActivityEvent } from '../interfaces/types';
import { deepValidateQuestionnaire, validateAnswers } from './validationHelpers';

interface PublishQuestionnairesRequest {
  mainQuestionnaireId: string;
  additionalQuestionnaireId: string;
}

interface PreviewMultiQuestionnaireRequest {
  questionnaireIds: string[];
  localeCode?: string | null;
}

type TUseMutationOptions<D = unknown, T = void> = Omit<
  UseMutationOptions<D, Error, T>,
  'mutationKey' | 'mutationFn'
>;
// `number`, not `StatusCodes`: `getResponseFromError` reports a bare status code, and comparing the
// two types trips `no-unsafe-enum-comparison`.
const RETRYABLE_STATUSES: readonly number[] = [
  StatusCodes.BAD_GATEWAY,
  StatusCodes.GATEWAY_TIMEOUT,
];

const retry = (failureCount: number, error: Error) => {
  if (failureCount > 1) {
    return false;
  }
  const status = getResponseFromError(error)?.status;
  if (status === undefined) {
    return false;
  }
  return RETRYABLE_STATUSES.includes(status);
};

// Do not pin `staleTime` here. It would not remove a loading state — the page gates on `isPending`,
// which is false once anything is cached — it would only let one user's answer outlive them in the
// module-scoped cache.
export const useQuestionnaireStatus = () => {
  return useQuery({
    queryKey: ['experienceQuestionnaire', 'getQuestionnaireStatus'],
    queryFn: () => experienceQuestionnaireClient.getQuestionnaireStatus(),
    retry,
  });
};

export const useUniverseEligibility = (universeId: number | undefined) => {
  return useQuery({
    queryKey: ['experienceQuestionnaire', 'getUniverseEligibility', universeId],
    queryFn:
      typeof universeId === 'undefined'
        ? skipToken
        : () => experienceQuestionnaireClient.getUniverseEligibility(universeId),
    retry,
  });
};

export const useLatestQuestionnaireId = (universeId: number) => {
  return useQuery({
    queryKey: ['experienceQuestionnaire', 'getLatestQuestionnaireIdForUniverse', universeId],
    queryFn: () => experienceQuestionnaireClient.getLatestQuestionnaireIdForUniverse(universeId),
    retry,
  });
};

export const useQuestionnaire = (
  questionnaireId: string | undefined,
  localeCode: string | null,
) => {
  const queryFn = async (qid: string) => {
    const response = await experienceQuestionnaireClient.getQuestionnaireById(qid, localeCode);
    if (response.questionnaire) {
      return deepValidateQuestionnaire(response.questionnaire);
    }

    return null;
  };

  return useQuery({
    queryKey: ['experienceQuestionnaire', 'getQuestionnaireById', questionnaireId],
    queryFn: typeof questionnaireId === 'undefined' ? skipToken : () => queryFn(questionnaireId),
    retry,
  });
};

export const useAnswers = (universeId: number) => {
  return useQuery({
    queryKey: ['experienceQuestionnaire', 'getAnswersByUniverseId', universeId],
    queryFn: async () => {
      try {
        const response = await experienceQuestionnaireClient.getAnswersByUniverseId(universeId);

        if (response.response?.answers) {
          return validateAnswers(response.response?.answers || []);
        }
      } catch (e) {
        const status = getResponseFromError(e)?.status;
        if (status !== 404) {
          throw e;
        }
      }
      return [];
    },
    retry,
    gcTime: 0,
    refetchOnMount: 'always',
  });
};

export const useLatestSubmission = (universeId: number) => {
  return useQuery({
    queryKey: ['experienceQuestionnaire', 'getSubmissionLatest', universeId],
    queryFn: async () => {
      try {
        return await experienceQuestionnaireClient.getSubmissionLatest(universeId);
      } catch (e) {
        const status = getResponseFromError(e)?.status;

        if (status === 404) {
          return null;
        }
        throw e;
      }
    },
    retry,
  });
};

export const useSaveAnswers = (
  universeId: number,
  options: TUseMutationOptions<void, { questionnaireId: string; answers: ValidatedAnswer[] }> = {},
) => {
  return useMutation({
    mutationKey: ['experienceQuestionnaire', 'saveResponseByUniverseId'],
    mutationFn: ({ questionnaireId, answers }) => {
      return experienceQuestionnaireClient.saveResponseByUniverseId(universeId, questionnaireId, {
        answers,
      });
    },
    ...options,
  });
};

export const useSubmitAnswers = (
  universeId: number,
  options: TUseMutationOptions<
    SubmitResponseResponse | null,
    { questionnaireId: string; answers: ValidatedAnswer[] }
  > = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['experienceQuestionnaire', 'saveResponseByUniverseId'],
    mutationFn: ({ questionnaireId, answers }) => {
      return experienceQuestionnaireClient.submitResponseByUniverseId(universeId, questionnaireId, {
        answers,
      });
    },
    // Used to updating submissionState and progressState so landing shows the correct text.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['experienceQuestionnaire'] }),
    ...options,
  });
};

export const useValidateAnswers = (
  options: TUseMutationOptions<
    ValidateResponseResponse | null,
    { questionnaireId: string; answers: ValidatedAnswer[] }
  > = {},
) => {
  return useMutation({
    mutationKey: ['experienceQuestionnaire', 'validateResponse'],
    mutationFn: ({ questionnaireId, answers }) => {
      return experienceQuestionnaireClient.validateResponse(questionnaireId, {
        answers,
      });
    },
    ...options,
  });
};

export const useAdditionalQuestionnaire = (
  questionnaireId: string | undefined,
  universeId: number,
  localeCode: string | null,
) => {
  const queryFn = async (qid: string) => {
    if (!qid) {
      return null;
    }
    const response = await experienceQuestionnaireV2Client.getAdditionalQuestionnaire(
      universeId,
      localeCode,
    );
    if (response.questionnaire) {
      return deepValidateQuestionnaire(response.questionnaire);
    }
    return null;
  };

  return useQuery({
    queryKey: [
      'experienceQuestionnaireV2',
      'getAdditionalQuestionnaire',
      questionnaireId,
      universeId,
    ],
    queryFn: typeof questionnaireId === 'undefined' ? skipToken : () => queryFn(questionnaireId),
    retry,
  });
};

export const useAdditionalQuestionnaireAnswers = (
  questionnaireId: string | undefined,
  universeId: number,
) => {
  const queryFn = async (qid: string) => {
    if (!qid) {
      return [];
    }
    const response = await experienceQuestionnaireV2Client.getActiveAdditionalResponse(universeId);
    const answers = response.response?.answers ?? [];
    return validateAnswers(answers);
  };

  return useQuery({
    queryKey: [
      'experienceQuestionnaireV2',
      'getAdditionalQuestionnaireAnswers',
      questionnaireId,
      universeId,
    ],
    queryFn: typeof questionnaireId === 'undefined' ? skipToken : () => queryFn(questionnaireId),
    retry,
    gcTime: 0,
    refetchOnMount: 'always',
  });
};

export const useSubmitAnswersV2 = (
  universeId: number,
  options: TUseMutationOptions<
    SubmitResponseResponseV2,
    { questionnaireId: string; answers: ValidatedAnswer[] }
  > = {},
) => {
  return useMutation<
    SubmitResponseResponseV2,
    Error,
    { questionnaireId: string; answers: ValidatedAnswer[] }
  >({
    mutationKey: ['experienceQuestionnaireV2', 'submitAdditionalResponse', universeId],
    mutationFn: ({ questionnaireId, answers }) => {
      return experienceQuestionnaireV2Client.submitResponseByUniverseId(universeId, {
        questionnaireId,
        response: {
          answers,
        },
      });
    },
    ...options,
  });
};

export const useAdditionalLatestSubmissionV2 = (universeId: number) => {
  return useQuery<GetLatestAdditionalSubmissionResponse | null>({
    queryKey: ['experienceQuestionnaireV2', 'getAdditionalLatestSubmission', universeId],
    queryFn: async () => {
      try {
        return await experienceQuestionnaireV2Client.getAdditionalLatestSubmission(universeId);
      } catch (e) {
        const status = getResponseFromError(e)?.status;
        if (status === 404) {
          return null;
        }
        console.warn(
          'Failed to fetch additional latest submission, proceeding with empty state',
          e,
        );
        return null;
      }
    },
    retry,
    gcTime: 0,
    refetchOnMount: 'always',
  });
};

export const usePreviewMultiQuestionnaireV2 = (
  universeId: number,
  options: TUseMutationOptions<PreviewSubmissionsResponse, PreviewMultiQuestionnaireRequest> = {},
) => {
  return useMutation({
    mutationKey: ['experienceQuestionnaireV2', 'previewMultiQuestionnaire', universeId],
    mutationFn: ({ questionnaireIds, localeCode }) => {
      return experienceQuestionnaireV2Client.previewMultiQuestionnaire(
        {
          universeId,
          questionnaireIds,
        },
        localeCode ?? null,
      );
    },
    ...options,
  });
};

export const usePublishQuestionnaires = (
  universeId: number,
  options: TUseMutationOptions<unknown, PublishQuestionnairesRequest> = {},
) => {
  return useMutation({
    mutationKey: ['experienceQuestionnaireV2', 'publishQuestionnaires', universeId],
    mutationFn: (request: PublishQuestionnairesRequest) => {
      return experienceQuestionnaireV2Client.publish(
        {
          universeId,
          questionnaireIds: [request.mainQuestionnaireId, request.additionalQuestionnaireId],
        },
        null,
      );
    },
    ...options,
  });
};

export const useDetailedGuidelines = (universeId: number) => {
  return useQuery({
    queryKey: ['experienceGuidelinesService', 'getDetailedGuidelines', universeId],
    queryFn: async (): Promise<GetDetailedGuidelinesResponse | null> => {
      try {
        return await experienceGuidelinesServiceApiClient.getDetailedGuidelines(universeId);
      } catch (e) {
        const status = getResponseFromError(e)?.status;
        if (status === 404) {
          return null;
        }
        throw e;
      }
    },
    retry,
  });
};

export const useDetailedGuidelinesV2 = (universeId: number) => {
  return useQuery({
    queryKey: ['experienceGuidelinesService', 'getDetailedGuidelinesV2', universeId],
    queryFn: async (): Promise<GetDetailedGuidelinesResponseV2 | null> => {
      try {
        return await experienceGuidelinesServiceApiClient.getDetailedGuidelinesV2(universeId);
      } catch (e) {
        const status = getResponseFromError(e)?.status;
        if (status === 404) {
          return null;
        }
        throw e;
      }
    },
    retry,
  });
};

export const useQuestionnairePublishStatusList = (universeId: number) => {
  return useQuery({
    queryKey: ['experienceQuestionnaire', 'getQuestionnairePublishStatusList', universeId],
    queryFn: async () => {
      try {
        return await experienceQuestionnaireClient.getQuestionnairePublishStatusList(universeId);
      } catch (e) {
        const status = getResponseFromError(e)?.status;
        if (status === 404) {
          return null;
        }
        throw e;
      }
    },
    retry,
  });
};

export const useMetadataStatus = (universeId: number) => {
  return useQuery({
    queryKey: ['experienceQuestionnaire', 'getMetadataStatus', universeId],
    queryFn: () => experienceQuestionnaireClient.getMetadataStatus(universeId),
    retry,
  });
};

const formatActivityTitle = (type: string | undefined): string => {
  switch (type) {
    case 'IARC_ACTIVITY_TYPE_QUESTIONNAIRE_SUBMITTED':
      return 'Questionnaire submitted';
    case 'IARC_ACTIVITY_TYPE_LIVE_RATINGS_NOTICE':
      return 'Ratings assigned';
    case 'IARC_ACTIVITY_TYPE_RATINGS_CHECK_REVIEW_RECEIVED':
      return 'Ratings check review received';
    case 'IARC_ACTIVITY_TYPE_GRAC_REFUSE_CLASSIFICATION':
      return 'GRAC refused classification';
    case 'IARC_ACTIVITY_TYPE_RATING_CHANGE_NOTICE':
      return 'Rating change notice';
    case 'IARC_ACTIVITY_TYPE_RATING_AUTHORITY_CUSTOM_EMAIL':
      return 'Rating authority custom email';
    case 'IARC_ACTIVITY_TYPE_ROBLOX_MODERATION_REJECTION':
      return 'Ratings rejected';
    case undefined:
    default:
      return 'Activity';
  }
};

const isSystemActivity = (type: string | undefined): boolean => {
  return type !== 'IARC_ACTIVITY_TYPE_QUESTIONNAIRE_SUBMITTED';
};

const normalizeActivityType = (type: string | undefined): string => {
  return type === undefined || type === '' ? 'IARC_ACTIVITY_TYPE_INVALID' : type;
};

export const useActivityLog = (universeId: number) => {
  return useQuery({
    queryKey: ['iarcActivityService', 'listIarcActivities', universeId],
    queryFn: async (): Promise<ActivityEvent[]> => {
      try {
        const response = await iarcActivityServiceClient.listIarcActivities(universeId);
        return (response.iarcActivities ?? []).map((activity, index) => ({
          id: `${activity.universeId}-${index}`,
          type: normalizeActivityType(activity.type),
          title: formatActivityTitle(activity.type),
          details: activity.details ?? '',
          createTime: activity.createTime ?? '',
          user: isSystemActivity(activity.type) ? 'System' : 'You',
        }));
      } catch (e) {
        const status = getResponseFromError(e)?.status;
        if (status === 404) {
          return [];
        }
        throw e;
      }
    },
    retry,
  });
};

export const useActivityLogById = (universeId: number, activityId: string | undefined) => {
  return useQuery({
    queryKey: ['iarcActivityService', 'getIarcActivity', universeId, activityId],
    queryFn:
      typeof activityId === 'undefined'
        ? skipToken
        : async (): Promise<ActivityEvent | null> => {
            try {
              const response = await iarcActivityServiceClient.getIarcActivity(
                universeId,
                activityId,
              );

              const activity = response.iarcActivity;
              if (!activity) {
                return null;
              }

              return {
                id: activityId,
                type: normalizeActivityType(activity.type),
                title: formatActivityTitle(activity.type),
                details: activity.details ?? '',
                createTime: activity.createTime ?? '',
                user: isSystemActivity(activity.type) ? 'System' : 'You',
              };
            } catch (e) {
              const status = getResponseFromError(e)?.status;
              if (status === 404) {
                return null;
              }
              throw e;
            }
          },
    retry,
  });
};

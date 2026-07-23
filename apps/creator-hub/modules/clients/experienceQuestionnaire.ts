import type {
  GetActiveAdditionalResponseResponse,
  GetAdditionalQuestionnaireResponse as GetAdditionalQuestionnaireResponseV2,
  GetLatestAdditionalSubmissionResponse,
  PreviewSubmissionsRequestBody,
  PreviewSubmissionsResponse,
  PublishRequestBody,
  QuestionnairesGetAdditionalQuestionnaireRequest,
  ResponsesGetActiveAdditionalResponseRequest,
  ResponsesGetAdditionalLatestSubmissionRequest,
  ResponsesPreviewMultiQuestionnaireRequest,
  ResponsesPublishRequest,
  ResponsesSubmitResponseRequest as ResponsesSubmitResponseRequestV2,
  SubmitResponseRequestBody,
  SubmitResponseResponse as SubmitResponseResponseV2,
} from '@rbx/client-experience-questionnaire-v2/v2';
import {
  QuestionnairesApi as QuestionnairesApiV2,
  ResponsesApi as ResponsesApiV2,
} from '@rbx/client-experience-questionnaire-v2/v2';
import type {
  GetActiveResponseResponse,
  GetUniverseEligibilityResponse,
  GetLatestQuestionnaireIdResponse,
  GetQuestionnaireStatusForUserResponse,
  GetLatestSubmissionResponse,
  GetQuestionnaireByIdResponse,
  GetMetadataStatusResponse,
  MetadataGetUniverseMetadataStatusRequest,
  QuestionnairesGetQuestionnaireByIdRequest,
  QuestionnairesGetLatestQuestionnaireIdForUniverseRequest,
  Response,
  ResponsesGetActiveResponseRequest,
  ResponsesGetLatestSubmissionRequest,
  ResponsesSaveActiveResponseRequest,
  ResponsesSubmitResponseRequest,
  SubmitResponseResponse,
  EligibilityGetUniverseEligibilityRequest,
  ResponsesValidateResponseRequest,
  ValidateResponseResponse,
  ResponsesPreviewDescriptorsRequest,
  PreviewSubmissionResponse,
  GetQuestionnairePublishStatusListResponse,
  ResponsesGetQuestionnairePublishStatusListRequest,
} from '@rbx/client-experience-questionnaire/v1';
import {
  EligibilityApi,
  MetadataApi,
  QuestionnairesApi,
  ResponsesApi,
} from '@rbx/client-experience-questionnaire/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type {
  Answer,
  CheckBoxQuestion,
  Questionnaire,
  RadioButtonQuestion,
  Section,
  GetLatestSubmissionResponse,
  GetQuestionnaireStatusForUserResponse,
  GetUniverseEligibilityResponse,
  Response,
  GetActiveResponseResponse,
  GetLatestQuestionnaireIdResponse,
  GetQuestionnaireByIdResponse,
  GetMetadataStatusResponse,
  GetQuestionnairePublishStatusListResponse,
  SubmitResponseResponse,
  Question,
  TextBoxQuestion,
  ContentDescriptor,
  RestrictedCountry,
  HelpInfo,
  HelpInfoExample,
  ImageLink,
  VideoLink,
} from '@rbx/client-experience-questionnaire/v1';
export {
  TextBoxValidationType,
  EligibilityType,
  MetadataStatus,
} from '@rbx/client-experience-questionnaire/v1';

export type {
  Answer as AnswerV2,
  CheckBoxOption,
  CheckBoxQuestion as CheckBoxQuestionV2,
  GetActiveAdditionalResponseResponse,
  GetAdditionalQuestionnaireResponse,
  GetLatestAdditionalSubmissionResponse,
  PreviewSubmissionsRequestBody,
  PreviewSubmissionsResponse,
  PublishRequestBody,
  Question as QuestionV2,
  Questionnaire as QuestionnaireV2,
  RadioButtonOption,
  RadioButtonQuestion as RadioButtonQuestionV2,
  Response as ResponseV2,
  Section as SectionV2,
  SubmitResponseRequestBody,
  SubmitResponseResponse as SubmitResponseResponseV2,
  TextBoxQuestion as TextBoxQuestionV2,
  HelpInfo as HelpInfoV2,
  HelpInfoExample as HelpInfoExampleV2,
  ImageLink as ImageLinkV2,
  VideoLink as VideoLinkV2,
} from '@rbx/client-experience-questionnaire-v2/v2';
export { TextBoxValidationType as TextBoxValidationTypeV2 } from '@rbx/client-experience-questionnaire-v2/v2';

const configuration = createClientConfiguration('experience-questionnaire', 'bedev2');

const questionnaireApi = new QuestionnairesApi(configuration);
const responseApi = new ResponsesApi(configuration);
const eligibilityApi = new EligibilityApi(configuration);
const metadataApi = new MetadataApi(configuration);

const questionnairesApiV2 = new QuestionnairesApiV2(configuration);
const responsesApiV2 = new ResponsesApiV2(configuration);

export interface ExperienceQuestionnaireClient {
  getUniverseEligibility(universeId: number): Promise<GetUniverseEligibilityResponse>;
  getQuestionnaireStatus(): Promise<GetQuestionnaireStatusForUserResponse>;
  getLatestQuestionnaireIdForUniverse(
    universeId: number,
  ): Promise<GetLatestQuestionnaireIdResponse>;
  getSubmissionLatest(universeId: number): Promise<GetLatestSubmissionResponse>;
  getQuestionnaireById(
    questionnaireId: string,
    localeCode: string | null,
  ): Promise<GetQuestionnaireByIdResponse>;
  getAnswersByUniverseId(universeId: number): Promise<GetActiveResponseResponse>;
  saveResponseByUniverseId(
    universeId: number,
    questionnaireId: string,
    response: Response,
  ): Promise<void>;
  validateResponse(questionnaireId: string, response: Response): Promise<ValidateResponseResponse>;
  getSubmissionPreview(
    universeId: number,
    questionnaireId: string,
    response: Response,
    localeCode: string | null,
  ): Promise<PreviewSubmissionResponse>;
  submitResponseByUniverseId(
    universeId: number,
    questionnaireId: string,
    response: Response,
  ): Promise<SubmitResponseResponse>;
  getMetadataStatus(universeId: number): Promise<GetMetadataStatusResponse>;
  getQuestionnairePublishStatusList(
    universeId: number,
  ): Promise<GetQuestionnairePublishStatusListResponse>;
}

const experienceQuestionnaireClient: ExperienceQuestionnaireClient = {
  getUniverseEligibility(universeId: number): Promise<GetUniverseEligibilityResponse> {
    const eligibilityByUniverseIdRequest: EligibilityGetUniverseEligibilityRequest = { universeId };
    return eligibilityApi.eligibilityGetUniverseEligibility(eligibilityByUniverseIdRequest);
  },
  getQuestionnaireStatus(): Promise<GetQuestionnaireStatusForUserResponse> {
    return questionnaireApi.questionnairesGetQuestionnaireStatusForUser();
  },
  getLatestQuestionnaireIdForUniverse(
    universeId: number,
  ): Promise<GetLatestQuestionnaireIdResponse> {
    const questionnairesGetLatestQuestionnaireIdForUniverseRequest: QuestionnairesGetLatestQuestionnaireIdForUniverseRequest =
      {
        universeId,
      };
    return questionnaireApi.questionnairesGetLatestQuestionnaireIdForUniverse(
      questionnairesGetLatestQuestionnaireIdForUniverseRequest,
    );
  },
  getSubmissionLatest(universeId: number): Promise<GetLatestSubmissionResponse> {
    const getLatestSubmissionRequest: ResponsesGetLatestSubmissionRequest = {
      universeId,
    };
    return responseApi.responsesGetLatestSubmission(getLatestSubmissionRequest);
  },
  getQuestionnaireById(
    questionnaireId: string,
    localeCode: string | null,
  ): Promise<GetQuestionnaireByIdResponse> {
    const questionnaireByIdRequest: QuestionnairesGetQuestionnaireByIdRequest = {
      questionnaireId,
      localeCode,
    };
    return questionnaireApi.questionnairesGetQuestionnaireById(questionnaireByIdRequest);
  },
  getAnswersByUniverseId(universeId: number): Promise<GetActiveResponseResponse> {
    const answersByUniverseIdRequest: ResponsesGetActiveResponseRequest = {
      universeId,
    };
    return responseApi.responsesGetActiveResponse(answersByUniverseIdRequest);
  },
  async saveResponseByUniverseId(
    universeId: number,
    questionnaireId: string,
    response: Response,
  ): Promise<void> {
    const saveResponseRequest: ResponsesSaveActiveResponseRequest = {
      saveActiveResponseRequestBody: {
        questionnaireId,
        response,
      },
      universeId,
    };
    await responseApi.responsesSaveActiveResponse(saveResponseRequest);
  },
  async validateResponse(
    questionnaireId: string,
    response: Response,
  ): Promise<ValidateResponseResponse> {
    const validateResponseRequest: ResponsesValidateResponseRequest = {
      validateResponseRequestBody: {
        questionnaireId,
        response,
      },
    };

    return responseApi.responsesValidateResponse(validateResponseRequest);
  },
  async getSubmissionPreview(
    universeId: number,
    questionnaireId: string,
    response: Response,
    localeCode: string | null,
  ): Promise<PreviewSubmissionResponse> {
    const previewRequest: ResponsesPreviewDescriptorsRequest = {
      previewSubmissionRequestBody: {
        universeId,
        questionnaireId,
        response,
      },
      localeCode,
    };

    return responseApi.responsesPreviewDescriptors(previewRequest);
  },
  submitResponseByUniverseId(
    universeId: number,
    questionnaireId: string,
    response: Response,
  ): Promise<SubmitResponseResponse> {
    const submitResponseRequest: ResponsesSubmitResponseRequest = {
      submitResponseRequestBody: {
        questionnaireId,
        response,
      },
      universeId,
    };
    return responseApi.responsesSubmitResponse(submitResponseRequest);
  },
  getMetadataStatus(universeId: number): Promise<GetMetadataStatusResponse> {
    const request: MetadataGetUniverseMetadataStatusRequest = { universeId };
    return metadataApi.metadataGetUniverseMetadataStatus(request);
  },
  getQuestionnairePublishStatusList(
    universeId: number,
  ): Promise<GetQuestionnairePublishStatusListResponse> {
    const request: ResponsesGetQuestionnairePublishStatusListRequest = { universeId };
    return responseApi.responsesGetQuestionnairePublishStatusList(request);
  },
};

export interface ExperienceQuestionnaireV2Client {
  getAdditionalQuestionnaire(
    universeId: number,
    localeCode: string | null,
  ): Promise<GetAdditionalQuestionnaireResponseV2>;
  getActiveAdditionalResponse(universeId: number): Promise<GetActiveAdditionalResponseResponse>;
  getAdditionalLatestSubmission(universeId: number): Promise<GetLatestAdditionalSubmissionResponse>;
  previewMultiQuestionnaire(
    previewSubmissionsRequestBody: PreviewSubmissionsRequestBody,
    localeCode: string | null,
  ): Promise<PreviewSubmissionsResponse>;
  publish(publishRequestBody: PublishRequestBody, localeCode: string | null): Promise<object>;
  submitResponseByUniverseId(
    universeId: number,
    submitResponseRequestBody: SubmitResponseRequestBody | undefined,
  ): Promise<SubmitResponseResponseV2>;
}

export const experienceQuestionnaireV2Client: ExperienceQuestionnaireV2Client = {
  getAdditionalQuestionnaire(
    universeId: number,
    localeCode: string | null,
  ): Promise<GetAdditionalQuestionnaireResponseV2> {
    const request: QuestionnairesGetAdditionalQuestionnaireRequest = { universeId, localeCode };
    return questionnairesApiV2.questionnairesGetAdditionalQuestionnaire(request);
  },
  getActiveAdditionalResponse(universeId: number): Promise<GetActiveAdditionalResponseResponse> {
    const request: ResponsesGetActiveAdditionalResponseRequest = { universeId };
    return responsesApiV2.responsesGetActiveAdditionalResponse(request);
  },
  getAdditionalLatestSubmission(
    universeId: number,
  ): Promise<GetLatestAdditionalSubmissionResponse> {
    const request: ResponsesGetAdditionalLatestSubmissionRequest = { universeId };
    return responsesApiV2.responsesGetAdditionalLatestSubmission(request);
  },
  previewMultiQuestionnaire(
    previewSubmissionsRequestBody: PreviewSubmissionsRequestBody,
    localeCode: string | null,
  ): Promise<PreviewSubmissionsResponse> {
    const request: ResponsesPreviewMultiQuestionnaireRequest = {
      previewSubmissionsRequestBody,
      localeCode,
    };
    return responsesApiV2.responsesPreviewMultiQuestionnaire(request);
  },
  publish(publishRequestBody: PublishRequestBody, localeCode: string | null): Promise<object> {
    const request: ResponsesPublishRequest = {
      publishRequestBody,
      localeCode,
    };
    return responsesApiV2.responsesPublish(request);
  },
  submitResponseByUniverseId(
    universeId: number,
    submitResponseRequestBody: SubmitResponseRequestBody | undefined,
  ): Promise<SubmitResponseResponseV2> {
    const request: ResponsesSubmitResponseRequestV2 = { universeId, submitResponseRequestBody };
    return responsesApiV2.responsesSubmitResponse(request);
  },
};

export default experienceQuestionnaireClient;

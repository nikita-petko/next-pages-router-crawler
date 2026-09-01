import type {
  ExperienceReviewListResponse,
  GetReviewsGetExperienceDiscoveryPageChannelReviewsRequest,
  ReportReviewReportExperienceDiscoveryPageChannelReviewOperationRequest,
  ReportDownloadGetPlayerFeedbackReportRequest,
  TranslateCommentResponse,
  TranslateCommentTranslateCommentOperationRequest,
} from '@rbx/client-player-generated-reviews-service/v1';
import {
  GetReviewsApi,
  ReportReviewApi,
  ReportDownloadApi,
  TranslateCommentApi,
} from '@rbx/client-player-generated-reviews-service/v1';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';

const configuration = createClientConfiguration('player-generated-reviews-service', 'bedev2');

const getReviewsApi = new GetReviewsApi(configuration);
const reportReviewApi = new ReportReviewApi(configuration);
const reportDownloadApi = new ReportDownloadApi(configuration);
const translateCommentApi = new TranslateCommentApi(configuration);

export const getAssetReviews = async (
  request: GetReviewsGetExperienceDiscoveryPageChannelReviewsRequest,
): Promise<ExperienceReviewListResponse> => {
  const response = await getReviewsApi.getReviewsGetExperienceDiscoveryPageChannelReviews(request);
  return response;
};

export const reportAssetReview = async (
  request: ReportReviewReportExperienceDiscoveryPageChannelReviewOperationRequest,
): Promise<void> => {
  await reportReviewApi.reportReviewReportExperienceDiscoveryPageChannelReview(request);
};

export const downloadAssetReviews = async (
  request: ReportDownloadGetPlayerFeedbackReportRequest,
): Promise<Blob> => {
  const response = await reportDownloadApi.reportDownloadGetPlayerFeedbackReport(request);
  return response;
};

export const translateComment = async (
  request: TranslateCommentTranslateCommentOperationRequest,
): Promise<TranslateCommentResponse> => {
  const response = await translateCommentApi.translateCommentTranslateComment(request);
  return response;
};

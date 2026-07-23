import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';
import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  ExperienceReviewListResponse,
  GetReviewsApi,
  GetReviewsGetExperienceDiscoveryPageChannelReviewsRequest,
  ReportReviewApi,
  ReportReviewReportExperienceDiscoveryPageChannelReviewOperationRequest,
  ReportDownloadApi,
  ReportDownloadGetPlayerFeedbackReportRequest,
  TranslateCommentApi,
  TranslateCommentResponse,
  TranslateCommentTranslateCommentOperationRequest,
} from '@rbx/clients/playerGeneratedReviewsService';

const basePath = getBEDEV2ServiceBasePath('player-generated-reviews-service');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

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
  const response =
    await reportReviewApi.reportReviewReportExperienceDiscoveryPageChannelReview(request);
  return response;
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

import adsClient from '@clients/ads';
import { ReportCreationStatus } from '@constants/reportDownload';
import { CreateReportDownloadRequest } from '@type/reportDownload';

interface CreateReportDownloadResponseBody {
  reportDownloadRequestId?: string;
}

interface GetReportCreationStatusResponse {
  reportCreationStatus?: ReportCreationStatus;
}

interface GetReportDownloadUrlResponse {
  reportPreSignedUrl?: string;
}

export const createReportDownload = async (body: CreateReportDownloadRequest) => {
  const response = await adsClient.post<CreateReportDownloadResponseBody>({
    body,
    url: '/v2/reportDownload',
  });
  return response.data;
};

export const getReportCreationStatus = async (reportDownloadRequestId: string) => {
  const response = await adsClient.get<GetReportCreationStatusResponse>({
    url: `/v2/reportDownload/creationStatus?report_download_request_id=${reportDownloadRequestId}`,
  });
  return response.data;
};

export const getReportDownloadUrl = async (reportDownloadRequestId: string) => {
  const response = await adsClient.get<GetReportDownloadUrlResponse>({
    url: `/v2/reportDownload/url?report_download_request_id=${reportDownloadRequestId}`,
  });
  return response.data;
};

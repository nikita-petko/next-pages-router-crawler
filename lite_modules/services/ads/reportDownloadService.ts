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

const getUniverseIdQuerySection = (universeId?: number): string =>
  universeId === undefined ? '' : `&universeId=${universeId}`;

export const createReportDownload = async (
  body: CreateReportDownloadRequest,
  universeId?: number,
) => {
  const universeIdQuery = universeId === undefined ? '' : `?universeId=${universeId}`;
  const response = await adsClient.post<CreateReportDownloadResponseBody>({
    body,
    url: `/v2/reportDownload${universeIdQuery}`,
  });
  return response.data;
};

export const getReportCreationStatus = async (
  reportDownloadRequestId: string,
  universeId?: number,
) => {
  const response = await adsClient.get<GetReportCreationStatusResponse>({
    url: `/v2/reportDownload/creationStatus?report_download_request_id=${reportDownloadRequestId}${getUniverseIdQuerySection(universeId)}`,
  });
  return response.data;
};

export const getReportDownloadUrl = async (
  reportDownloadRequestId: string,
  universeId?: number,
) => {
  const response = await adsClient.get<GetReportDownloadUrlResponse>({
    url: `/v2/reportDownload/url?report_download_request_id=${reportDownloadRequestId}${getUniverseIdQuerySection(universeId)}`,
  });
  return response.data;
};

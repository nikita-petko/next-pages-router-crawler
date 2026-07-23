import universePerformanceRaqiClient, {
  ErrorLoggingDetail,
  GetErrorLogsRequest,
} from '@modules/clients/analytics/universePerformanceRaqi';
import { NonPaginatedRequest, usePaginatedRequest } from '@modules/experience-analytics-shared';

export const PAGE_SIZE = 25;

const getErrorLogs = async (request: GetErrorLogsRequest) => {
  return universePerformanceRaqiClient.getErrorLogs(request);
};

const useErrorLogsRequest = (request: NonPaginatedRequest<GetErrorLogsRequest>) => {
  return usePaginatedRequest<GetErrorLogsRequest, ErrorLoggingDetail>(
    request,
    getErrorLogs,
    PAGE_SIZE,
  );
};

export default useErrorLogsRequest;

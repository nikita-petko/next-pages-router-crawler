import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { Configuration } from '@rbx/clients';
import {
  DefaultApi as CrashDumpsApi,
  type GameserverDatamodelDumpsListCrashDumpsRequest as GetCrashDumpsRequest,
  type GameserverDatamodelDumpsGetCrashDumpRequest as GetCrashDumpFileRequest,
  type InternalControllerHttpControllerCrashDumpListItem as RawCrashDumpData,
} from '@rbx/clients/gameserverDatamodelDumps';
import { getBEDEV2ServiceBasePath } from './utils';

export type { GetCrashDumpsRequest, GetCrashDumpFileRequest };
export type CrashDumpData = Omit<RawCrashDumpData, 'timestamp' | 'dumpId'> & {
  timestamp: Date;
  dumpId: string;
};
export type GetCrashDumpsResponse = {
  data: CrashDumpData[];
  total: number;
};
export type GetCrashDumpFileResponse = Record<string, unknown>;

const basePath = getBEDEV2ServiceBasePath('gameserver-datamodel-dumps');

const crashDumpsConfiguration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const crashDumpsApi = new CrashDumpsApi(crashDumpsConfiguration);

const getCrashDumps = async (request: GetCrashDumpsRequest): Promise<GetCrashDumpsResponse> => {
  const rawResponse = await crashDumpsApi.gameserverDatamodelDumpsListCrashDumps(request);

  const rawData = rawResponse.data ?? [];
  const total = rawResponse.total ?? 0;

  const data: CrashDumpData[] = rawData
    .filter(
      (item): item is RawCrashDumpData & { timestamp: string; dumpId: string } =>
        !!item.timestamp && !!item.dumpId,
    )
    .map((item) => ({
      ...item,
      timestamp: new Date(item.timestamp),
      dumpId: item.dumpId,
    }));

  return { data, total };
};

const getCrashDumpFile = async (
  request: GetCrashDumpFileRequest,
): Promise<GetCrashDumpFileResponse> => {
  const response = await crashDumpsApi.gameserverDatamodelDumpsGetCrashDump(request);
  return response as GetCrashDumpFileResponse;
};

const crashDumpsClient = {
  getCrashDumps,
  getCrashDumpFile,
};

export default crashDumpsClient;

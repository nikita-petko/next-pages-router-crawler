import { queryOptions, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { HardCodedPrice } from '@rbx/client-price-configuration-api/v1';
import priceConfigurationApi from '@modules/clients/priceConfigurationApi';
import { useMonetizationFlags } from '@modules/monetization-shared/flags/useMonetizationFlags';
import { MOCK_HARD_CODED_PRICE_INSTANCES } from '../mocks';
import type { HardCodedPriceReference } from '../types';
import { getFilenameFromPath } from '../utils/getFilenameFromPath';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_RETRIES,
  DEFAULT_STALE_TIME,
  hardCodedPricesKeys,
} from './constants';

type UseListAllHardCodedPricesParams = {
  universeId: number;
  scanJobId: string;
  pageSize?: number;
};

type Options<TData = HardCodedPriceReference[]> = Omit<
  UseQueryOptions<HardCodedPriceReference[], Error, TData>,
  'queryKey' | 'queryFn'
>;

function addFilename(
  codeReference: HardCodedPrice['codeReferences'][number],
): HardCodedPriceReference {
  return {
    ...codeReference,
    filename: getFilenameFromPath(codeReference.path),
  };
}

function extractCodeReferences(hardCodedPrice: HardCodedPrice[]): HardCodedPriceReference[] {
  // NOTE(@jeminpark,20260527): codeReferences may be empty - full page size is not known ahead of time.
  // TBD with content scan summary implementation (DMP-2610, DMP-2618)
  return hardCodedPrice.flatMap((p) => p.codeReferences.map(addFilename));
}

async function listAllHardCodedPrices(
  params: Required<UseListAllHardCodedPricesParams> & { mock?: boolean },
): Promise<HardCodedPriceReference[]> {
  if (params.mock) {
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    return MOCK_HARD_CODED_PRICE_INSTANCES.slice(0, params.pageSize);
  }

  let response = await priceConfigurationApi.listHardCodedPrices(params.universeId, {
    pageSize: params.pageSize,
    scanJobId: params.scanJobId,
  });

  // NOTE: each instance of a hard coded price represents a scan on a product - this may result in
  // either 0 or multiple code references per product annotation. We only need code references for this use case.
  let hardCodedPrices = extractCodeReferences(response.hardCodedPrices);
  while (response.nextPageToken) {
    response = await priceConfigurationApi.listHardCodedPrices(params.universeId, {
      pageSize: params.pageSize,
      scanJobId: params.scanJobId,
      pageToken: response.nextPageToken,
    });

    hardCodedPrices = hardCodedPrices.concat(extractCodeReferences(response.hardCodedPrices));
  }

  return hardCodedPrices;
}

function listAllHardCodedPricesQueryOptions<TData = HardCodedPriceReference[]>(
  params: Required<UseListAllHardCodedPricesParams> & { mock?: boolean },
  options?: Options<TData>,
) {
  const { universeId, scanJobId, pageSize, mock } = params;
  return queryOptions<HardCodedPriceReference[], Error, TData>({
    queryKey: hardCodedPricesKeys.listAll(universeId, scanJobId, { pageSize, mock }),
    queryFn: () => listAllHardCodedPrices(params),
    staleTime: DEFAULT_STALE_TIME,
    retry: DEFAULT_RETRIES,
    ...options,
  });
}

export function useListAllHardCodedPrices<TData = HardCodedPriceReference[]>(
  { universeId, scanJobId, pageSize = DEFAULT_PAGE_SIZE }: UseListAllHardCodedPricesParams,
  options: Options<TData> = {},
) {
  const { mockHardCodedPrices } = useMonetizationFlags('mockHardCodedPrices');

  return useQuery(
    listAllHardCodedPricesQueryOptions(
      { universeId, scanJobId, pageSize, mock: mockHardCodedPrices ?? false },
      options,
    ),
  );
}

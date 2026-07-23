import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ClaimContentContentTypeEnum,
  CheckContentPermissionsRequestContentTypeEnum,
} from '@rbx/client-rights/v1';
import rightsClient from '@modules/clients/rights';
import type { ParsedContentUrl } from '../helpers/parseContentUrl';
import { ContentCheckStatusOK } from './useContentPermissions';

const extractOwnedIds = (results: object | undefined): number[] => {
  if (!results) {
    return [];
  }
  return Object.entries(results)
    .filter(([, status]) => status === ContentCheckStatusOK)
    .map(([id]) => Number(id))
    .filter((id) => !Number.isNaN(id));
};

export default function useCheckSelfContent(infringingContents: ParsedContentUrl[]) {
  const validContents = useMemo(
    () => infringingContents.filter((c) => c.contentId !== -1),
    [infringingContents],
  );

  const assetIds = useMemo(
    () =>
      validContents
        .filter((c) => c.contentType === ClaimContentContentTypeEnum.Asset)
        .map((c) => String(c.contentId)),
    [validContents],
  );

  const bundleIds = useMemo(
    () =>
      validContents
        .filter((c) => c.contentType === ClaimContentContentTypeEnum.Bundle)
        .map((c) => String(c.contentId)),
    [validContents],
  );

  const { data: assetPermissions } = useQuery({
    queryKey: ['rightsClient/checkContentPermissions/asset', assetIds],
    queryFn: () =>
      rightsClient.checkContentPermissions(
        assetIds,
        CheckContentPermissionsRequestContentTypeEnum.Asset,
      ),
    enabled: assetIds.length > 0,
  });

  const { data: bundlePermissions } = useQuery({
    queryKey: ['rightsClient/checkContentPermissions/bundle', bundleIds],
    queryFn: () =>
      rightsClient.checkContentPermissions(
        bundleIds,
        CheckContentPermissionsRequestContentTypeEnum.Bundle,
      ),
    enabled: bundleIds.length > 0,
  });

  const selfOwnedIds = useMemo(
    () => [
      ...extractOwnedIds(assetPermissions?.results),
      ...extractOwnedIds(bundlePermissions?.results),
    ],
    [assetPermissions, bundlePermissions],
  );

  return { selfOwnedIds };
}

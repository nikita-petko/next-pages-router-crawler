import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { OwnershipPayloadV3 } from '../core';
import {
  DEFAULT_WATERMARK_SOURCE_PRODUCT,
  WatermarkSubjectType,
  encodeOwnershipWatermark,
  getDefaultWatermarkEncodeUrl,
  type WatermarkEncodeSubject,
} from '../serviceClient';

export type UseOwnershipWatermarkEncodeOptions = {
  subjects?: readonly WatermarkEncodeSubject[] | null;
  sourceProduct?: string | null;
  encodeUrl?: string | null;
  enabled?: boolean;
};

function isBrowserFetchAvailable(): boolean {
  return typeof window !== 'undefined' && typeof fetch === 'function';
}

function subjectQueryKey(subject: WatermarkEncodeSubject): readonly unknown[] {
  if (subject.type === WatermarkSubjectType.Team) {
    return [WatermarkSubjectType.Team, String(subject.teamId)];
  }
  if (subject.type === WatermarkSubjectType.Query) {
    return [
      WatermarkSubjectType.Query,
      subject.teamId ?? null,
      subject.resourceType,
      String(subject.resourceId),
      subject.metric,
      subject.breakdownDimension ?? null,
      subject.filterDimension ?? null,
      subject.truncated ?? false,
    ];
  }
  return [WatermarkSubjectType.Conversation, subject.conversationId];
}

function subjectsQueryKey(
  subjects: readonly WatermarkEncodeSubject[] | null | undefined,
): readonly unknown[] {
  if (!subjects || subjects.length === 0) {
    return ['none'];
  }
  return subjects.flatMap(subjectQueryKey);
}

export function getOwnershipWatermarkEncodeQueryKey({
  encodeUrl,
  subjects,
  sourceProduct,
}: UseOwnershipWatermarkEncodeOptions): readonly unknown[] {
  return [
    'ownership-watermark',
    'encode',
    encodeUrl ?? null,
    ...subjectsQueryKey(subjects),
    sourceProduct ?? null,
  ];
}

export function useOwnershipWatermarkEncode({
  subjects,
  sourceProduct = DEFAULT_WATERMARK_SOURCE_PRODUCT,
  encodeUrl = getDefaultWatermarkEncodeUrl(),
  enabled = true,
}: UseOwnershipWatermarkEncodeOptions): UseQueryResult<OwnershipPayloadV3> {
  const queryEnabled = Boolean(
    enabled && subjects && subjects.length > 0 && encodeUrl && isBrowserFetchAvailable(),
  );

  return useQuery({
    queryKey: getOwnershipWatermarkEncodeQueryKey({
      encodeUrl,
      subjects,
      sourceProduct,
    }),
    queryFn: ({ signal }) => {
      if (!subjects || subjects.length === 0 || !encodeUrl) {
        throw new Error('Encode query is missing subjects or endpoint.');
      }
      return encodeOwnershipWatermark({
        encodeUrl,
        request: {
          subjects,
          sourceProduct,
        },
        signal,
      });
    },
    enabled: queryEnabled,
    retry: false,
    throwOnError: false,
    staleTime: Infinity,
  });
}

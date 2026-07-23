import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type { OwnershipPayload } from '../core';
import {
  getDefaultWatermarkResolveUrl,
  resolveOwnershipWatermark,
  type ResolveWatermarkResponseDto,
} from '../serviceClient';

export type DecodeOwnershipWatermarkVariables = {
  payload: OwnershipPayload;
  resolveUrl?: string | null;
  signal?: AbortSignal;
};

export type UseOwnershipWatermarkDecodeOptions = {
  resolveUrl?: string | null;
  fetchImpl?: typeof fetch;
};

export function getOwnershipWatermarkDecodeMutationKey({
  resolveUrl,
}: UseOwnershipWatermarkDecodeOptions = {}): readonly unknown[] {
  return ['ownership-watermark', 'decode', resolveUrl ?? null];
}

export function useOwnershipWatermarkDecode({
  resolveUrl = getDefaultWatermarkResolveUrl(),
  fetchImpl,
}: UseOwnershipWatermarkDecodeOptions = {}): UseMutationResult<
  ResolveWatermarkResponseDto,
  Error,
  DecodeOwnershipWatermarkVariables
> {
  return useMutation({
    mutationKey: getOwnershipWatermarkDecodeMutationKey({ resolveUrl }),
    mutationFn: ({ payload, resolveUrl: requestResolveUrl, signal }) =>
      resolveOwnershipWatermark({
        payload,
        resolveUrl: requestResolveUrl ?? resolveUrl,
        signal,
        fetchImpl,
      }),
  });
}

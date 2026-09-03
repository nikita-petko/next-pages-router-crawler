import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import assetdeliveryClient from '@modules/clients/assetdelivery';

async function fetchAudioBuffer(assetId: number, signal?: AbortSignal): Promise<ArrayBuffer> {
  const assets = await assetdeliveryClient.getAssets([{ assetId, requestId: String(assetId) }]);
  const location = assets[0]?.location;
  if (!location) {
    throw new Error('No location');
  }

  const response = await fetch(location, { signal });
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  return response.arrayBuffer();
}

const FIVE_MINUTES = 5 * 60 * 1000;

const useAudioPlaybackUrl = (assetId: number) => {
  const {
    data: buffer,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['audioPlaybackUrl', assetId],
    queryFn: ({ signal }) => fetchAudioBuffer(assetId, signal),
    refetchOnWindowFocus: false,
    staleTime: FIVE_MINUTES,
  });

  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!buffer) {
      setBlobUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(new Blob([buffer], { type: 'audio/ogg' }));
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [buffer]);

  return { url: blobUrl, isLoading, error: isError };
};

export default useAudioPlaybackUrl;

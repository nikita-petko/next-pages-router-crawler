import type { FunctionComponent } from 'react';
import React from 'react';
import { BrokenImageOutlinedIcon, Skeleton } from '@rbx/ui';
import useAssetImageUrl from '../hooks/useAssetImageUrl';

export interface AssetImageProps {
  /** Image asset id to resolve and render. When null or not a finite id (e.g. NaN), nothing is rendered. */
  assetId: number | null;
  alt?: string;
  className?: string;
}

/**
 * Resolves an image asset id to a CDN URL and renders it, showing a skeleton while loading and a
 * broken-image icon on failure. The same `className` is applied to the skeleton and fallback so the
 * box keeps its dimensions across states.
 */
const AssetImage: FunctionComponent<AssetImageProps> = ({ assetId, alt = '', className }) => {
  const { url, isLoading, isError } = useAssetImageUrl(assetId);

  if (assetId == null || !Number.isFinite(assetId)) {
    return null;
  }
  if (isError) {
    return <BrokenImageOutlinedIcon className={className} />;
  }
  if (isLoading || !url) {
    return <Skeleton className={className} variant='rectangular' />;
  }
  return <img alt={alt} className={className} loading='lazy' src={url} />;
};

export default AssetImage;

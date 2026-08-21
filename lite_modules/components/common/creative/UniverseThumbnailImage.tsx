import { memo } from 'react';

type UniverseThumbnailSize = 20 | 24;

interface UniverseThumbnailImageProps {
  size?: UniverseThumbnailSize;
  src?: string;
}

// Tailwind only emits utilities it can find as literals, so each size is spelled out.
const sizeClassNames: Record<UniverseThumbnailSize, string> = {
  20: '!size-[20px]',
  24: '!size-[24px]',
};

/**
 * Square game icon with a small corner radius, per Figma.
 * Foundation `Avatar` hardcodes `radius-circle`, so universe thumbnails render through
 * this instead of through `Avatar`.
 */
const UniverseThumbnailImage = memo(({ size = 20, src }: UniverseThumbnailImageProps) => (
  <span className={`inline-flex shrink-0 radius-small clip bg-shift-200 ${sizeClassNames[size]}`}>
    {src ? (
      <img alt='universe-thumbnail' className='size-full object-cover object-center' src={src} />
    ) : null}
  </span>
));

export default UniverseThumbnailImage;

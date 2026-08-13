import type { FunctionComponent } from 'react';
import { Link, clsx } from '@rbx/foundation-ui';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';

export type ShowcaseContentTileProps = {
  universeId: number;
  name: string;
  link?: string;
  showExternalIcon?: boolean;
  onClick?: () => void;
  className?: string;
};

/**
 * Presentational base tile for showcase content. Selection behavior belongs in a wrapper.
 */
export const ShowcaseContentTile: FunctionComponent<ShowcaseContentTileProps> = ({
  universeId,
  name,
  link,
  showExternalIcon = true,
  onClick,
  className,
}) => {
  const content = (
    <div className='flex flex-col gap-xsmall min-width-0 width-full'>
      <div className='relative width-full aspect-1-1 clip radius-medium bg-shift-300'>
        <Thumbnail2d
          alt={name}
          targetId={universeId}
          containerClass='absolute inset-[0] width-full height-full'
          imgClassName='width-full height-full [object-fit:cover]'
          type={ThumbnailTypes.gameIcon}
          includeBackground
        />
      </div>
      <span
        className='text-title-medium content-emphasis clip [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:1]'
        title={name}>
        {name}
      </span>
    </div>
  );

  return link != null ? (
    <Link
      className={clsx(
        'block min-width-0 width-full content-emphasis [text-decoration:none] hover:[text-decoration:none]',
        className,
      )}
      href={link}
      target='_blank'
      rel='noopener noreferrer'
      isExternal={showExternalIcon}
      underline='none'
      onClick={onClick}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
};

export default ShowcaseContentTile;

import type { FunctionComponent } from 'react';
import React from 'react';
import { Link } from '@rbx/foundation-ui';
import type { ThumbnailTypes } from '@rbx/thumbnails';
import EntityThumbnail from './EntityThumbnail';

// Single-line ellipsis for the name/experience labels, matching the Source column.
const LABEL_CLASS = 'text-body-medium content-default text-truncate-end min-width-0';

// isExternal={false} suppresses the trailing external-link glyph so the dense table matches the
// design.
const MaybeLink: FunctionComponent<
  React.PropsWithChildren<{ href?: string; className: string }>
> = ({ href, className, children }) =>
  href ? (
    <Link
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      isExternal={false}
      color='Standard'
      underline='none'
      className={className}>
      {children}
    </Link>
  ) : (
    <span className={className}>{children}</span>
  );

export type VirtualProductItemProps = {
  name: string;
  header?: string;
  // Some product types (e.g. subscriptions) have no thumbnail id in the payload.
  targetId?: number;
  thumbnailType?: ThumbnailTypes;
  href?: string;
  experienceName?: string;
  experienceHref?: string;
};

const VirtualProductItem: FunctionComponent<React.PropsWithChildren<VirtualProductItemProps>> = ({
  name,
  header,
  targetId,
  thumbnailType,
  href,
  experienceName,
  experienceHref,
}) => (
  <span className='flex items-center gap-small min-width-0'>
    {targetId !== undefined &&
      thumbnailType !== undefined && (
        // Keyed by type+id so a row reused across pagination remounts on target change, discarding
        // any in-flight request for the previous row.
        <EntityThumbnail
          key={`${thumbnailType}-${targetId}`}
          targetId={targetId}
          thumbnailType={thumbnailType}
          radiusClass='radius-small'
        />
      )}
    <span className='flex flex-col gap-xxsmall min-width-0'>
      {!!header && <span className='text-body-medium content-default'>{header}</span>}
      <MaybeLink href={href} className={LABEL_CLASS}>
        {name}
      </MaybeLink>
      {!!experienceName && (
        <MaybeLink href={experienceHref} className={LABEL_CLASS}>
          {experienceName}
        </MaybeLink>
      )}
    </span>
  </span>
);

export default VirtualProductItem;

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '@rbx/intl';
import { AssetThumbnailSize, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Breadcrumbs, Link as UILink } from '@rbx/ui';
import { IP_MATCHES_HREF } from '../../urls';

// Shared crumb layout so every crumb (link + title) uses the exact same font/formatting. Without the
// ol/li/separator center overrides a taller icon crumb sits high relative to the plain text crumb.
const crumbClassName = 'inline-flex items-center gap-small content-muted text-body-large';

// The current-page (title) crumb is white to match the emphasized current crumb in the IP breadcrumbs.
const titleCrumbClassName = 'inline-flex items-center gap-small content-emphasis text-body-large';

const breadcrumbsClassName =
  '[&_ol]:!items-center [&_li]:!inline-flex [&_li]:!items-center [&_.MuiBreadcrumbs-separator]:!inline-flex [&_.MuiBreadcrumbs-separator]:!items-center';

// Outer box owns the square size. Thumbnail2d's padding-top aspect-ratio hack is neutralized by
// absolute-filling this clip container so it cannot stretch the breadcrumb row.
const ICON_WRAPPER_CLASS = 'relative size-500 shrink-0 clip radius-small';
const THUMBNAIL_CLASS =
  '!absolute [inset:0] !width-full !height-full !padding-none !padding-top-none';
const THUMBNAIL_IMG_CLASS = '!width-full !height-full [object-fit:cover]';

interface Props {
  experienceId?: number;
  gameName?: string;
}

/**
 * Breadcrumbs for the Matches / Experience Preview pages: a root "Matches" crumb followed by the
 * experience crumb (game-icon thumbnail + name). Kept local so the shared `IpBreadcrumbs` — used by
 * every other IP page — stays icon-free and unaffected.
 */
const MatchesBreadcrumbs: React.FC<Props> = ({ experienceId, gameName }) => {
  const { translate } = useTranslation();

  const showTitleCrumb = !!gameName;
  const showIcon = showTitleCrumb && experienceId != null && Number.isFinite(experienceId);

  return (
    <Breadcrumbs aria-label='breadcrumb' className={breadcrumbsClassName}>
      <UILink component={Link} className={crumbClassName} href={IP_MATCHES_HREF} color='inherit'>
        {translate('Heading.Matches')}
      </UILink>
      {showTitleCrumb ? (
        <span className={titleCrumbClassName}>
          {showIcon ? (
            <span className={ICON_WRAPPER_CLASS}>
              <Thumbnail2d
                alt={gameName}
                targetId={experienceId}
                // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
                size={AssetThumbnailSize._50x50}
                skeletonVariant='square'
                type={ThumbnailTypes.gameIcon}
                containerClass={THUMBNAIL_CLASS}
                imgClassName={THUMBNAIL_IMG_CLASS}
              />
            </span>
          ) : null}
          {gameName}
        </span>
      ) : null}
    </Breadcrumbs>
  );
};

export default MatchesBreadcrumbs;

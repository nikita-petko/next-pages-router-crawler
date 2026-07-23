import React, { useMemo, useState } from 'react';
import { clsx } from '@rbx/foundation-ui';
import { Thumbnail2d, ThumbnailTypes, ReturnPolicy, GroupIconSize } from '@rbx/thumbnails';
import PlaceholderImage from './PlaceholderImage';
import styles from './Layout.module.css';

type StudioLogoProps = {
  logo?: string;
  groupId?: number;
  size: number;
  alt?: string;
  className?: string;
};

const ALLOWED_LOGO_HOSTS = [
  'rbxcdn.com',
  'roblox.com',
  'robloxlabs.com',
  'google.com',
  'google-analytics.com',
  'fullstory.com',
  'googletagmanager.com',
  'fonts.gstatic.com',
  'img.tarobicdn.com',
  'img.guildedcdn.com',
  'img.youtube.com',
  'devforum-uploads.s3.us-east-2.amazonaws.com',
  'devforum-uploads.s3.dualstack.us-east-2.amazonaws.com',
  'doy2mn9upadnk.cloudfront.net',
  'cdn.shopify.com',
  'm.media-amazon.com',
  'd3vcfwomg2mj2z.cloudfront.net',
];

export function isAllowedStudioLogoSource(src: string | undefined) {
  if (!src) {
    return false;
  }
  if (src.startsWith('/') || src.startsWith('data:') || src.startsWith('blob:')) {
    return true;
  }

  try {
    const { protocol, hostname } = new URL(src);
    if (protocol !== 'https:') {
      return false;
    }
    return ALLOWED_LOGO_HOSTS.some((allowedHost) => {
      return hostname === allowedHost || hostname.endsWith(`.${allowedHost}`);
    });
  } catch {
    return false;
  }
}

const StudioLogo: React.FC<StudioLogoProps> = ({ logo, groupId, size, alt = '', className }) => {
  const [didLogoFail, setDidLogoFail] = useState(false);
  const sizeClass = useMemo(() => {
    if (size >= 80) {
      return styles.studioLogoLarge;
    }
    if (size <= 32) {
      return styles.studioLogoSmall;
    }
    return styles.studioLogoMedium;
  }, [size]);

  if (isAllowedStudioLogoSource(logo) && !didLogoFail) {
    return (
      <div className={clsx('clip shrink-0 bg-shift-200', sizeClass, className)}>
        <img
          src={logo}
          alt={alt}
          className={`width-full height-full ${styles.objectCover}`}
          onError={(e) => {
            e.preventDefault();
            setDidLogoFail(true);
          }}
        />
      </div>
    );
  }

  if (groupId) {
    return (
      <div className={clsx('clip shrink-0', sizeClass, className)}>
        <Thumbnail2d
          targetId={groupId}
          type={ThumbnailTypes.groupIcon}
          // eslint-disable-next-line no-underscore-dangle -- third-party enum from @rbx/thumbnails
          size={GroupIconSize._150x150}
          returnPolicy={ReturnPolicy.PlaceHolder}
          containerClass={styles.thumbnailFill}
          imgClassName={styles.thumbnailFillImg}
          alt={alt}
        />
      </div>
    );
  }

  return <PlaceholderImage size={size} className={className} />;
};

export default StudioLogo;

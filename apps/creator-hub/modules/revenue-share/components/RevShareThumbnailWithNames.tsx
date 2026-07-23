import { useEffect, useState, type FunctionComponent } from 'react';
import { Badge, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  ReturnPolicy,
  Thumbnail2d,
  ThumbnailClient,
  ThumbnailResponseState,
  ThumbnailTypes,
} from '@rbx/thumbnails';
import type { TGroup } from '@modules/authentication/types';
import type { User } from '@modules/clients/users';
import type { TExperience } from '@modules/home/providers/ExperienceProvider';
import CreatorType from '@modules/miscellaneous/common/enums/Creator';
import { www } from '@modules/miscellaneous/urls';

export type RevShareThumbnailTargetTypes = CreatorType | 'Experience' | 'Ugc';

/** Minimal shape for a UGC (catalog asset) target; id is numeric for parity with User/Group/Experience. */
export type RevShareUgcTarget = { id: number };

type RevShareThumbnailVariant = 'compact' | 'medium' | 'large';
type RevShareTextVariant = 'primary' | 'secondary';
type RevShareThumbnailTarget = User | TGroup | TExperience | RevShareUgcTarget;

const THUMBNAIL_SIZE_CLASS_BY_VARIANT = {
  compact: 'size-800',
  medium: 'size-1200',
  large: 'size-1600',
} satisfies Record<RevShareThumbnailVariant, string>;

const THUMBNAIL_TEXT_GAP_CLASS_BY_VARIANT = {
  compact: 'gap-medium',
  medium: 'gap-large',
  large: 'gap-xlarge',
} satisfies Record<RevShareThumbnailVariant, string>;

const getThumbnailTargetType = (targetType: RevShareThumbnailTargetTypes) => {
  if (targetType === CreatorType.User) {
    return ThumbnailTypes.avatarHeadshot;
  }
  if (targetType === CreatorType.Group) {
    return ThumbnailTypes.groupIcon;
  }
  if (targetType === 'Ugc') {
    return ThumbnailTypes.assetThumbnail;
  }
  // Same as group payouts: square game icon keyed by universe/experience id.
  return ThumbnailTypes.gameIcon;
};

const isValidThumbnailUrl = (imageUrl: string | undefined): imageUrl is string => {
  if (!imageUrl) {
    return false;
  }

  try {
    return new URL(imageUrl).protocol === 'https:';
  } catch {
    return false;
  }
};

const RevShareCompletedThumbnail: FunctionComponent<{
  alt: string;
  imgClassName: string;
  targetId: number;
  thumbnailType: ThumbnailTypes;
}> = ({ alt, imgClassName, targetId, thumbnailType }) => {
  const [resolvedThumbnail, setResolvedThumbnail] = useState<{
    targetId: number;
    thumbnailType: ThumbnailTypes;
    url: string;
  }>();

  useEffect(() => {
    let isCurrentTarget = true;

    void ThumbnailClient.getThumbnailImage(thumbnailType, targetId)
      .then(({ imageUrl, state }) => {
        if (
          isCurrentTarget &&
          state === ThumbnailResponseState.Completed &&
          isValidThumbnailUrl(imageUrl)
        ) {
          setResolvedThumbnail({ targetId, thumbnailType, url: imageUrl });
        }
      })
      .catch(() => undefined);

    return () => {
      isCurrentTarget = false;
    };
  }, [targetId, thumbnailType]);

  return resolvedThumbnail?.targetId === targetId &&
    resolvedThumbnail.thumbnailType === thumbnailType ? (
    <img className={imgClassName} src={resolvedThumbnail.url} alt={alt} />
  ) : null;
};

const getThumbnailHref = ({
  target,
  targetType,
  disableLink,
  obfuscate,
}: {
  target: RevShareThumbnailTarget;
  targetType: RevShareThumbnailTargetTypes;
  disableLink: boolean;
  obfuscate: boolean;
}): string | undefined => {
  if (disableLink || !target.id || obfuscate) {
    return undefined;
  }

  if (targetType === CreatorType.User) {
    return www.getUserUrl(target.id);
  }
  if (targetType === CreatorType.Group) {
    return www.getGroupUrl(target.id);
  }
  if (targetType === 'Experience') {
    const rootPlaceId = 'rootPlaceId' in target ? target.rootPlaceId : undefined;
    return rootPlaceId ? www.getGameDetailsUrl(rootPlaceId) : undefined;
  }
  if (targetType === 'Ugc') {
    return www.getCatalogUrl(target.id);
  }

  return undefined;
};

export interface RevShareThumbnailWithNamesProps {
  target: RevShareThumbnailTarget;
  targetType: RevShareThumbnailTargetTypes;
  /** When non-empty, shown as the primary label instead of deriving it from the target fields. */
  displayNameOverride?: string;
  /** When provided, replaces the fetched thumbnail with this solid color; it is not a tint. */
  thumbnailColorOverride?: string;
  /**
   * Circular backing color shown when no thumbnail resolves. Does not suppress fetching.
   * Defaults to `thumbnailColorOverride` when unset.
   */
  thumbnailFallbackColor?: string;
  adornment?: React.JSX.Element;
  label?: string;
  disabled?: boolean;
  variant?: RevShareThumbnailVariant;
  disableLink?: boolean;
  obfuscate?: boolean;
  hideThumbnail?: boolean;
  hideSecondaryLabel?: boolean;
  textVariant?: RevShareTextVariant;
  labelTooltip?: string;
}

const RevShareThumbnailWithNames: FunctionComponent<
  React.PropsWithChildren<RevShareThumbnailWithNamesProps>
> = ({
  target,
  targetType,
  displayNameOverride,
  thumbnailColorOverride,
  thumbnailFallbackColor,
  adornment,
  label,
  disabled,
  variant = 'medium',
  disableLink = false,
  obfuscate = false,
  hideThumbnail = false,
  hideSecondaryLabel = false,
  textVariant = 'primary',
  labelTooltip,
}) => {
  const { translate } = useTranslation();
  const thumbnailSizeClass = THUMBNAIL_SIZE_CLASS_BY_VARIANT[variant];
  const thumbnailTextGapClass = THUMBNAIL_TEXT_GAP_CLASS_BY_VARIANT[variant];
  const effectiveThumbnailFallbackColor = thumbnailFallbackColor ?? thumbnailColorOverride;
  const thumbnailTargetType = getThumbnailTargetType(targetType);
  const thumbnailHref = getThumbnailHref({ target, targetType, disableLink, obfuscate });

  let derivedPrimaryLabel: string | undefined;
  if (displayNameOverride) {
    derivedPrimaryLabel = displayNameOverride;
  } else if (targetType === CreatorType.User) {
    derivedPrimaryLabel = 'displayName' in target ? target.displayName : undefined;
  } else if (targetType !== 'Ugc') {
    derivedPrimaryLabel = 'name' in target ? target.name : undefined;
  }

  const showPrimarySkeleton =
    !displayNameOverride &&
    ((targetType === CreatorType.User && !('displayName' in target && target.displayName)) ||
      targetType === 'Ugc');

  const showSecondaryLabel =
    !hideSecondaryLabel &&
    (targetType === CreatorType.User ||
      targetType === CreatorType.Group ||
      targetType === 'Experience');

  const primaryTextClass = (() => {
    if (textVariant === 'secondary') {
      return 'text-body-medium';
    }
    if (variant === 'compact') {
      return 'text-title-medium content-emphasis';
    }
    if (variant === 'large') {
      return 'text-heading-medium content-emphasis';
    }
    return 'text-heading-small content-emphasis';
  })();

  const secondaryTextClass = 'text-body-medium content-muted';
  const primaryLineHeightClass =
    variant === 'large' && textVariant === 'primary' ? '[line-height:135%]' : undefined;

  const mutedPrimaryClass = disabled ? 'content-muted' : undefined;
  const mutedSecondaryClass = disabled ? 'content-muted' : undefined;

  const labelContent = (
    <>
      {showPrimarySkeleton ? (
        <span
          className={`block bg-surface-200 radius-small height-300 width-2400 ${mutedPrimaryClass ?? ''}`}
          aria-hidden
        />
      ) : (
        <div className='flex items-center gap-xsmall min-width-0'>
          <span
            className={`block clip text-no-wrap min-width-0 ${primaryTextClass} ${primaryLineHeightClass ?? ''} ${mutedPrimaryClass ?? ''}`}>
            {obfuscate ? translate('Label.Other') : derivedPrimaryLabel}
          </span>
          {label && label.length > 0 ? (
            labelTooltip ? (
              <Tooltip position='right-center' title={labelTooltip}>
                <TooltipTrigger asChild>
                  <Badge variant='Neutral' label={label} />
                </TooltipTrigger>
              </Tooltip>
            ) : (
              <Badge variant='Neutral' label={label} />
            )
          ) : null}
        </div>
      )}

      {showSecondaryLabel ? (
        targetType === CreatorType.User ? (
          'name' in target && !target.name ? (
            <span
              className={`block bg-surface-200 radius-small height-300 width-2400 ${mutedSecondaryClass ?? ''}`}
              aria-hidden
            />
          ) : (
            <span
              className={`block clip text-no-wrap min-width-0 ${secondaryTextClass} ${mutedSecondaryClass ?? ''}`}>
              {obfuscate ? translate('Label.Other') : `@${'name' in target ? target.name : ''}`}
            </span>
          )
        ) : (
          <span
            className={`block clip text-no-wrap min-width-0 ${secondaryTextClass} ${mutedSecondaryClass ?? ''}`}>
            {obfuscate ? translate('Label.Other') : target.id}
          </span>
        )
      ) : null}
    </>
  );

  if (target?.id === undefined) {
    return (
      <span
        className={`block bg-surface-200 radius-small width-full ${thumbnailSizeClass}`}
        aria-hidden
      />
    );
  }

  const textLayoutClass = showSecondaryLabel
    ? 'flex flex-col min-width-0'
    : 'flex items-center min-width-0';

  const identityContent = (
    <div className={`${textLayoutClass} width-fit min-width-0`}>{labelContent}</div>
  );

  return (
    <div className='flex items-center no-wrap min-width-0 width-fit justify-between'>
      <div className={`flex items-center no-wrap min-width-0 ${thumbnailTextGapClass}`}>
        {!hideThumbnail ? (
          <div
            className={`flex shrink-0 clip radius-circle ${effectiveThumbnailFallbackColor === undefined ? 'bg-surface-200' : ''} ${thumbnailSizeClass} ${disabled ? '[filter:grayscale(100%)]' : ''}`}
            style={
              effectiveThumbnailFallbackColor === undefined
                ? undefined
                : { backgroundColor: effectiveThumbnailFallbackColor }
            }>
            {thumbnailColorOverride === undefined ? (
              targetType === CreatorType.Group || targetType === CreatorType.User ? (
                <RevShareCompletedThumbnail
                  targetId={target.id}
                  thumbnailType={thumbnailTargetType}
                  imgClassName={
                    effectiveThumbnailFallbackColor === undefined
                      ? 'bg-surface-200 width-full height-full'
                      : 'width-full height-full'
                  }
                  alt={translate('Label.Thumbnail')}
                />
              ) : (
                <Thumbnail2d
                  targetId={target.id}
                  type={thumbnailTargetType}
                  imgClassName={
                    effectiveThumbnailFallbackColor === undefined
                      ? 'bg-surface-200 width-full height-full'
                      : 'width-full height-full'
                  }
                  alt={translate('Label.Thumbnail')}
                  returnPolicy={ReturnPolicy.PlaceHolder}
                  includeBackground={false}
                />
              )
            ) : (
              <div
                data-testid='thumbnail-color-override'
                className='width-full height-full'
                style={{
                  backgroundColor: thumbnailColorOverride,
                }}
              />
            )}
          </div>
        ) : null}

        {disableLink || obfuscate || thumbnailHref === undefined ? (
          identityContent
        ) : (
          <a href={thumbnailHref} className='content-default stroke-none min-width-0'>
            {identityContent}
          </a>
        )}
      </div>
      {adornment}
    </div>
  );
};

export default RevShareThumbnailWithNames;

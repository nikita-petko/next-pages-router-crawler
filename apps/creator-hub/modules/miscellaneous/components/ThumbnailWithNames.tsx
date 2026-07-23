import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Typography, Grid, makeStyles, Avatar, Link, Skeleton, Chip, Tooltip } from '@rbx/ui';
import type { TGroup } from '@modules/authentication/types';
import type { User } from '@modules/clients/users';
import type { TExperience } from '@modules/home/providers/ExperienceProvider';
import CreatorType from '../common/enums/Creator';
import { www } from '../urls';

export type TThumbnailTargetTypes = CreatorType | 'Experience' | 'Ugc';

/** Minimal shape for a UGC (catalog asset) target; id is numeric for parity with User/Group/Experience. */
export type TUgcTarget = { id: number };

type ThumbnailVariant = 'compact' | 'medium' | 'large';
type TextVariant = 'primary' | 'secondary';
const THUMBNAIL_SIZE_BY_VARIANT = {
  compact: 32,
  medium: 48,
  large: 64,
} satisfies Record<ThumbnailVariant, number>;
const THUMBNAIL_MARGIN_RIGHT_BY_VARIANT = {
  compact: 12,
  medium: 16,
  large: 20,
} satisfies Record<ThumbnailVariant, number>;
const USER_BORDER_RADIUS_BY_VARIANT = {
  compact: 32,
  medium: 48,
  large: 64,
} satisfies Record<ThumbnailVariant, number>;
const NON_USER_BORDER_RADIUS_BY_VARIANT = {
  compact: 4,
  medium: 6,
  large: 8,
} satisfies Record<ThumbnailVariant, number>;

const useThumbnailWithNamesStyles = makeStyles<{ variant: ThumbnailVariant }>()(
  (theme, { variant }) => ({
    container: {
      minWidth: 0,
      width: 'fit-content',
    },

    avatarContainer: {
      width: THUMBNAIL_SIZE_BY_VARIANT[variant],
      height: THUMBNAIL_SIZE_BY_VARIANT[variant],
      marginRight: THUMBNAIL_MARGIN_RIGHT_BY_VARIANT[variant],
    },

    userBorderRadius: {
      borderRadius: USER_BORDER_RADIUS_BY_VARIANT[variant],
    },

    nonUserBorderRadius: {
      borderRadius: NON_USER_BORDER_RADIUS_BY_VARIANT[variant],
    },

    thumbnailItemContainer: {
      display: 'flex',
      alignItems: 'center',
    },

    thumbnailBackground: {
      background: theme.palette.surface[200],
    },

    itemText: {
      whiteSpace: 'nowrap',
      '& > *:not(:last-child)': {
        paddingBottom: 4,
      },
    },

    mutedText: {
      color: theme.palette.content.muted,
    },

    disabledThumbnail: {
      filter: 'grayscale(100%)',
    },

    textContainer: {
      display: 'block',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      '& > *:not(:first-child)': {
        display: 'block',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
    },
  }),
);

export interface ThumbnailWithNamesProps {
  target: User | TGroup | TExperience | TUgcTarget;
  targetType: TThumbnailTargetTypes;
  /** When non-empty, shown as the primary label instead of deriving it from the target fields. */
  displayNameOverride?: string;
  adornment?: React.JSX.Element;
  label?: string;
  disabled?: boolean;
  variant?: ThumbnailVariant;
  disableLink?: boolean;
  obfuscate?: boolean;
  hideThumbnail?: boolean;
  hideSecondaryLabel?: boolean;
  textVariant?: TextVariant;
  labelTooltip?: string;
}

const ThumbnailWithNames: FunctionComponent<React.PropsWithChildren<ThumbnailWithNamesProps>> = ({
  target,
  targetType,
  displayNameOverride,
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
  const {
    classes: {
      container,
      avatarContainer,
      thumbnailItemContainer,
      thumbnailBackground,
      userBorderRadius,
      nonUserBorderRadius,
      itemText,
      mutedText,
      disabledThumbnail,
      textContainer,
    },

    cx,
  } = useThumbnailWithNamesStyles({ variant });

  const { translate } = useTranslation();

  const thumbnailTargetType = useMemo(() => {
    if (targetType === CreatorType.User) {
      return ThumbnailTypes.avatarHeadshot;
    }
    if (targetType === CreatorType.Group) {
      return ThumbnailTypes.groupIcon;
    }
    if (targetType === 'Ugc') {
      return ThumbnailTypes.assetThumbnail;
    }
    return ThumbnailTypes.universeThumbnail;
  }, [targetType]);

  const thumbnailHref = useMemo((): string | undefined => {
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
  }, [disableLink, target, obfuscate, targetType]);

  // Primary label: non-empty override wins; otherwise User → displayName, Group/Experience → name.
  // Ugc has no derived name — callers must pass displayNameOverride.
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

  const nameComponents = useMemo(
    () => (
      <Grid container direction='row' alignItems='center' wrap='wrap'>
        {/* Primary label for user is displayName, for group or experience it is name (or the override) */}
        {showPrimarySkeleton ? (
          <Skeleton animate variant='text' width={192} height={22} />
        ) : (
          <Grid container direction='row' alignItems='center' wrap='wrap' columnGap={1}>
            <Typography
              className={textContainer}
              variant={(() => {
                if (textVariant === 'secondary') {
                  return 'body1';
                }
                if (variant === 'compact') {
                  return 'captionHeader';
                }
                if (variant === 'large') {
                  return 'h2';
                }
                return 'h5';
              })()}
              color={disabled ? 'disabled' : 'inherit'}>
              {obfuscate ? translate('Label.Other') : derivedPrimaryLabel}
            </Typography>
            {label && label.length > 0 && (
              <Tooltip
                arrow
                title={labelTooltip}
                placement='right'
                enterTouchDelay={0}
                leaveTouchDelay={3000}>
                <Chip color='secondary' label={label} size='small' variant='filled' />
              </Tooltip>
            )}
          </Grid>
        )}

        {!hideSecondaryLabel && (
          <>
            {/* User secondary label is username */}
            {targetType === CreatorType.User && (
              <>
                {'name' in target && !target.name ? (
                  <Skeleton animate variant='text' width={192} height={20} />
                ) : (
                  <Typography
                    variant={(() => {
                      if (textVariant === 'secondary') {
                        return 'body2';
                      }
                      return 'captionBody';
                    })()}
                    className={cx(textContainer, {
                      [mutedText]: textVariant === 'secondary' || variant === 'compact',
                    })}
                    color={disabled ? 'disabled' : 'inherit'}>
                    {obfuscate
                      ? translate('Label.Other')
                      : `@${'name' in target ? target.name : ''}`}
                  </Typography>
                )}
              </>
            )}

            {/* Group secondary label is groupId (id) and experience is universeId (id); Ugc has no secondary label */}
            {(targetType === CreatorType.Group || targetType === 'Experience') && (
              <Typography
                variant='captionBody'
                className={cx(textContainer, {
                  [mutedText]: textVariant === 'secondary' || variant === 'compact',
                })}
                color={disabled ? 'disabled' : 'inherit'}>
                {obfuscate ? translate('Label.Other') : target.id}
              </Typography>
            )}
          </>
        )}
      </Grid>
    ),
    [
      showPrimarySkeleton,
      derivedPrimaryLabel,
      targetType,
      target,
      textContainer,
      disabled,
      obfuscate,
      translate,
      label,
      hideSecondaryLabel,
      cx,
      mutedText,
      textVariant,
      variant,
      labelTooltip,
    ],
  );

  return (
    <Grid
      container
      direction='row'
      alignItems='center'
      wrap='nowrap'
      justifyContent='space-between'
      className={container}>
      {target?.id === undefined ? (
        <Skeleton
          animate
          variant='rectangular'
          width='100%'
          height={THUMBNAIL_SIZE_BY_VARIANT[variant]}
        />
      ) : (
        <>
          <Grid container wrap='nowrap'>
            {!hideThumbnail && (
              <Grid item className={thumbnailItemContainer}>
                <Avatar
                  variant='rounded'
                  alt='avatar'
                  className={cx(avatarContainer, {
                    [userBorderRadius]: targetType === CreatorType.User,
                    [nonUserBorderRadius]: targetType !== CreatorType.User,
                    [disabledThumbnail]: disabled,
                  })}>
                  <Thumbnail2d
                    targetId={target.id}
                    type={thumbnailTargetType}
                    imgClassName={thumbnailBackground}
                    alt='thumbnail'
                    returnPolicy={ReturnPolicy.PlaceHolder}
                    includeBackground={false}
                  />
                </Avatar>
              </Grid>
            )}

            <Grid container direction='column' className={container}>
              <Grid item>
                {disableLink || obfuscate ? (
                  nameComponents
                ) : (
                  <Link href={thumbnailHref} className={itemText} color='inherit'>
                    {nameComponents}
                  </Link>
                )}
              </Grid>
            </Grid>
          </Grid>
          {adornment}
        </>
      )}
    </Grid>
  );
};

export default ThumbnailWithNames;

import React, { Fragment, FunctionComponent, useMemo } from 'react';
import { Typography, Grid, makeStyles, Avatar, Link, Skeleton, Chip, Tooltip } from '@rbx/ui';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { User } from '@modules/clients';
import type { TGroup } from '@modules/authentication/types';
import { useTranslation } from '@rbx/intl';
import type { TExperience } from '@modules/home/providers/ExperienceProvider';
import CreatorType from '../enums/Creator';
import { www } from '../urls';

export type TThumbnailTargetTypes = CreatorType | 'Experience';

type ThumbnailVariant = 'compact' | 'medium';
type TextVariant = 'primary' | 'secondary';
const useThumbnailWithNamesStyles = makeStyles<{ variant: ThumbnailVariant }>()(
  (theme, { variant }) => ({
    container: {
      minWidth: 0,
      width: 'fit-content',
    },

    avatarContainer: {
      width: variant === 'compact' ? 32 : 48,
      height: variant === 'compact' ? 32 : 48,
      marginRight: variant === 'compact' ? 12 : 16,
    },

    userBorderRadius: {
      borderRadius: variant === 'compact' ? 32 : 48,
    },

    nonUserBorderRadius: {
      borderRadius: variant === 'compact' ? 4 : 6,
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
  target: User | TGroup | TExperience;
  targetType: TThumbnailTargetTypes;
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
  adornment,
  label,
  disabled,
  variant = 'medium',
  disableLink = false,
  obfuscate = false,
  hideThumbnail = false,
  hideSecondaryLabel = false,
  textVariant = 'primary',
  labelTooltip = undefined,
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
    return ThumbnailTypes.universeThumbnail;
  }, [targetType]);

  const thumbnailHref = useMemo(() => {
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
      const asExperience = target as TExperience;
      return asExperience.rootPlaceId ? www.getGameDetailsUrl(asExperience.rootPlaceId) : undefined;
    }

    return undefined;
  }, [disableLink, target, obfuscate, targetType]);

  const nameComponents = useMemo(
    () => (
      <Grid container direction='row' alignItems='center' wrap='wrap'>
        {/* Primary label for user is displayName, for group or experience it is name */}
        {targetType === CreatorType.User && !(target as User).displayName ? (
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
                return 'h5';
              })()}
              color={disabled ? 'disabled' : 'inherit'}>
              {obfuscate
                ? translate('Label.Other')
                : `${targetType === CreatorType.User ? (target as User).displayName : target.name}`}
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
          <Fragment>
            {/* User secondary label is username */}
            {targetType === CreatorType.User && (
              <Fragment>
                {!target.name ? (
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
                    {obfuscate ? translate('Label.Other') : `@${target.name}`}
                  </Typography>
                )}
              </Fragment>
            )}

            {/* Group secondary label is groupId (id) and experience is universeId (id) */}
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
          </Fragment>
        )}
      </Grid>
    ),
    [
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
          height={variant === 'compact' ? 32 : 48}
        />
      ) : (
        <Fragment>
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
        </Fragment>
      )}
    </Grid>
  );
};

export default ThumbnailWithNames;

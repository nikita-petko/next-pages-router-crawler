import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { ReturnPolicy, ThumbnailTypes } from '@rbx/thumbnails';
import { Card, CardContent, Link, makeStyles, Skeleton, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useThumbnailImage from '@modules/miscellaneous/components/ThumbnailImage/useThumbnailImage';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import useThumbnailTableMode from '../hooks/useThumbnailTableMode';
import HomepageThumbnailUploadButton from './HomepageThumbnailUploadButton';

const thumbnailHeight = 59;
const thumbnailWidth = 105;

const useStyles = makeStyles()((theme) => {
  return {
    card: {
      backgroundColor: 'transparent',
      border: `1px solid ${theme.palette.surface.outline}`,
    },
    cardContent: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '48px',
      '&:last-child': {
        paddingBottom: '48px',
      },
    },
    thumbnail: {
      height: thumbnailHeight,
      width: thumbnailWidth,
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      marginBottom: '16px',
      ...theme.border.radius.small,
    },
    thumbnailSkeleton: {
      marginBottom: '16px',
      ...theme.border.radius.small,
    },
    descriptionContainer: {
      maxWidth: 550,
      textAlign: 'center',
      margin: '6px 0 16px 0',
    },
  };
});

type StartPersonalizeThumbnailsCardProps = {
  universeId: number;
  isUserViewAnalyticsOnly?: boolean;
};

const StartPersonalizeThumbnailsCard: FC<StartPersonalizeThumbnailsCardProps> = ({
  universeId,
  isUserViewAnalyticsOnly,
}) => {
  const {
    classes: { card, thumbnail, cardContent, descriptionContainer, thumbnailSkeleton },
  } = useStyles();
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const { turnOnEditingMode } = useThumbnailTableMode({ universeId });

  const { title, description } = useMemo(
    () => ({
      title: translate(
        translationKey('Title.StartPersonalizeThumbnails', TranslationNamespace.PlaceThumbnails),
      ),
      description: translateHTML(
        translationKey(
          'Description.StartPersonalizeThumbnails',
          TranslationNamespace.PlaceThumbnails,
        ),
        [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content(chunks) {
              return (
                <Link
                  href={creatorHub.docs.getPromotionalThumbnailsUrl()}
                  target='_blank'
                  role='link'>
                  {chunks}
                </Link>
              );
            },
          },
        ],
      ),
    }),
    [translate, translateHTML],
  );

  const { thumbnailData } = useThumbnailImage({
    targetId: universeId,
    targetType: ThumbnailTypes.universeThumbnail,
    returnPolicy: ReturnPolicy.PlaceHolder,
    fontColor: 'dark',
  });

  return (
    <Card classes={{ root: card }}>
      <CardContent classes={{ root: cardContent }}>
        {thumbnailData?.imageUrl ? (
          <div
            className={thumbnail}
            style={{
              backgroundImage: `url(${thumbnailData.imageUrl})`,
            }}
          />
        ) : (
          <Skeleton
            variant='rectangular'
            width={thumbnailWidth}
            height={thumbnailHeight}
            animate
            classes={{ root: thumbnailSkeleton }}
          />
        )}
        <Typography variant='h4' display='block'>
          {title}
        </Typography>
        <Typography
          variant='body1'
          color='secondary'
          classes={{ root: descriptionContainer }}
          display='block'>
          {description}
        </Typography>
        <HomepageThumbnailUploadButton
          universeId={universeId}
          size='medium'
          variant='contained'
          isUserViewAnalyticsOnly={isUserViewAnalyticsOnly}
          onUploadSuccess={turnOnEditingMode}
        />
      </CardContent>
    </Card>
  );
};

export default StartPersonalizeThumbnailsCard;

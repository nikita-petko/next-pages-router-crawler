import { useQueries } from '@tanstack/react-query';
import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import type { RobloxWebResponsesThumbnailsThumbnailResponse } from '@rbx/client-thumbnails/v1';
import { useTranslation } from '@rbx/intl';
import { ReturnPolicy, ThumbnailClient, ThumbnailFormat, ThumbnailTypes } from '@rbx/thumbnails';
import { Container, makeStyles, Typography } from '@rbx/ui';
import Flex from '@modules/miscellaneous/components/Flex';
import { creatorHub } from '@modules/miscellaneous/urls';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useGetHomepageThumbnailsQuery } from '@modules/react-query/thumbnailPersonalization';
import ImagePreview from './ImagePreview';

const queryPrefix = 'IconAndThumbnail';

const iconSize = 512;
const thumbnailWidth = 576;
const thumbnailHeight = 324;

const useStyles = makeStyles()(() => ({
  icon: {
    aspectRatio: 1,
    flex: `${iconSize} ${iconSize} auto`,
  },
  thumbnail: {
    aspectRatio: `${thumbnailWidth / thumbnailHeight}`,
    flex: `${(thumbnailWidth / thumbnailHeight) * iconSize} ${(thumbnailWidth / thumbnailHeight) * iconSize} auto`,
  },
}));

const IconAndThumbnail: FC = () => {
  const {
    classes: { icon, thumbnail },
  } = useStyles();
  const { translate } = useTranslation();
  const { gameDetails } = useCurrentGame();
  const universeId = gameDetails?.id ?? 0;
  const rootPlaceId = gameDetails?.rootPlaceId ?? 0;

  // Use one of the actively enabled personalized thumbnails.
  // If user hasn't enabled thumbnails personalization, use current homepage thumbnail as fallback
  const { data: homepageThumbnails } = useGetHomepageThumbnailsQuery(universeId);
  const activeThumbnailUrl = useMemo(() => {
    return homepageThumbnails?.thumbnails.find((item) => item.active)?.imageUrl;
  }, [homepageThumbnails?.thumbnails]);

  const select = useCallback(
    (data: RobloxWebResponsesThumbnailsThumbnailResponse) => data.imageUrl,
    [],
  );
  const [{ data: iconUrl }, { data: fallbackThumbnailUrl }] = useQueries({
    queries: [
      {
        queryKey: [queryPrefix, 'getPlaceIcon', rootPlaceId],
        queryFn: async () => {
          return ThumbnailClient.getThumbnailImage(
            ThumbnailTypes.placeIcon,
            rootPlaceId,
            ReturnPolicy.PlaceHolder,
            ThumbnailFormat.webp,
            `${iconSize}x${iconSize}`,
          );
        },
        select,
        enabled: !!rootPlaceId,
      },
      {
        queryKey: [queryPrefix, 'getUniverseThumbnail', universeId],
        queryFn: async () => {
          return ThumbnailClient.getThumbnailImage(
            ThumbnailTypes.universeThumbnail,
            universeId,
            ReturnPolicy.PlaceHolder,
            ThumbnailFormat.webp,
            `${thumbnailWidth}x${thumbnailHeight}`,
          );
        },
        select,
        enabled: !!universeId,
      },
    ],
  });

  return (
    <Container maxWidth={false} disableGutters>
      <Flex gap={16}>
        <ImagePreview
          imageUrl={iconUrl}
          linkTo={creatorHub.dashboard.getPlaceIconUrl(universeId, rootPlaceId)}
          className={icon}
        />
        <ImagePreview
          imageUrl={activeThumbnailUrl || fallbackThumbnailUrl}
          linkTo={creatorHub.dashboard.getPlaceThumbnailsUrl(universeId, rootPlaceId)}
          className={thumbnail}
        />
      </Flex>
      <Typography variant='body1' color='secondary' display='block' marginTop='12px'>
        {translate('Description.IconAndThumbnail' /** CreatorDashboard.ConfigureItem */)}
      </Typography>
    </Container>
  );
};

export default IconAndThumbnail;

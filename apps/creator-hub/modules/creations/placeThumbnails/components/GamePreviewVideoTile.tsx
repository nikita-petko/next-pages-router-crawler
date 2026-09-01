import type { FC } from 'react';
import { clsx, IconButton, Skeleton } from '@rbx/foundation-ui';
import { useTranslationWithNamespace } from '@rbx/intl';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { creatorHub } from '@modules/miscellaneous/urls';
import useGamePreviewVideoForPlaceQuery from '../hooks/useGamePreviewVideoForPlaceQuery';
import {
  GamePreviewVideoTileStatus,
  getGamePreviewVideoTileStatus,
} from '../utils/gamePreviewVideoTileStatus';
import GamePreviewVideoTileBody from './GamePreviewVideoTileBody';

type GamePreviewVideoTileProps = {
  className?: string;
  placeId: number;
  universeId: number;
};

// The video player controls use z-index 10, so the edit button must render above them
const EditButtonZIndexClassName = '[z-index:11]';

const GamePreviewVideoTile: FC<GamePreviewVideoTileProps> = ({
  className,
  placeId,
  universeId,
}) => {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.Creations);
  const isEnabled = placeId !== 0;
  const { data, isPending, isError } = useGamePreviewVideoForPlaceQuery(placeId, universeId, {
    enabled: isEnabled,
    shouldFetchContentQuality: true,
  });
  const href = creatorHub.dashboard.getPlaceVideosUrl(universeId, placeId);
  const videoPreviewId = data?.videoPreviewId ?? null;
  const status = getGamePreviewVideoTileStatus({
    isEnabled,
    isPending,
    isError,
    videoPreviewId,
    moderationState: data?.moderationState,
    videoContentQualityReviewStatus: data?.videoContentQualityReviewStatus,
    isVideoContentQualityReviewStatusError: data?.isVideoContentQualityReviewStatusError === true,
  });

  const hasVideo = videoPreviewId != null;
  const isEmpty = status === GamePreviewVideoTileStatus.Empty;
  const isStatusTile =
    status === GamePreviewVideoTileStatus.Reviewing ||
    status === GamePreviewVideoTileStatus.Rejected ||
    status === GamePreviewVideoTileStatus.Unavailable ||
    status === GamePreviewVideoTileStatus.Error;
  const frameClassName = clsx(
    'group relative clip radius-large min-width-0 width-full aspect-16-9',
    isEmpty && 'stroke-standard stroke-default',
    isStatusTile && 'bg-surface-200 stroke-standard stroke-default',
    !isEmpty && !isStatusTile && 'bg-surface-300',
    className,
  );

  return (
    <div className={frameClassName}>
      {status === GamePreviewVideoTileStatus.Loading ? (
        <Skeleton variant='Rectangle' width='100%' height='100%' />
      ) : (
        <GamePreviewVideoTileBody href={href} status={status} videoPreviewId={videoPreviewId} />
      )}
      {hasVideo ? (
        <div
          className={clsx(
            'absolute right-[8px] top-[8px] transition-opacity [@media(hover:hover)]:[opacity:0] [@media(hover:hover)]:group-hover:[opacity:1] [@media(hover:hover)]:group-focus-within:[opacity:1]',
            EditButtonZIndexClassName,
          )}>
          <IconButton
            as='a'
            href={href}
            variant='OverMedia'
            size='Small'
            icon='icon-regular-pencil'
            ariaLabel={translate('Action.Edit')}
          />
        </div>
      ) : null}
    </div>
  );
};

export default GamePreviewVideoTile;

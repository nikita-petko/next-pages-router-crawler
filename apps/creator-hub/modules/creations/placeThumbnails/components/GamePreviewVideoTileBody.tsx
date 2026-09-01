import type { FC } from 'react';
import { Button, Icon } from '@rbx/foundation-ui';
import { useTranslationWithNamespace } from '@rbx/intl';
import { RobloxVideoPlayer } from '@rbx/video-player';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import {
  GamePreviewVideoTileStatus,
  type GamePreviewVideoTileStatusValue,
} from '../utils/gamePreviewVideoTileStatus';

type GamePreviewVideoTileBodyStatus = Exclude<
  GamePreviewVideoTileStatusValue,
  typeof GamePreviewVideoTileStatus.Loading
>;

type GamePreviewVideoTileBodyProps = {
  href: string;
  status: GamePreviewVideoTileBodyStatus;
  videoPreviewId: number | null;
};

const getStatusPresentation = (status: GamePreviewVideoTileBodyStatus) => {
  if (status === GamePreviewVideoTileStatus.Rejected) {
    return {
      headingKey: 'Heading.VideoRejected',
      icon: 'icon-regular-triangle-exclamation',
    } as const;
  }

  if (
    status === GamePreviewVideoTileStatus.Unavailable ||
    status === GamePreviewVideoTileStatus.Error
  ) {
    return {
      headingKey: 'Heading.VideoStatusUnavailable',
      icon: 'icon-regular-triangle-exclamation',
    } as const;
  }

  return {
    headingKey: 'Heading.VideoInReview',
    icon: 'icon-regular-clock',
  } as const;
};

const GamePreviewVideoTileBody: FC<GamePreviewVideoTileBodyProps> = ({
  href,
  status,
  videoPreviewId,
}) => {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.ConfigureItem);

  if (status === GamePreviewVideoTileStatus.Empty) {
    return (
      <div className='flex height-full items-center justify-center'>
        <div className='flex flex-col items-center gap-xsmall padding-xsmall medium:gap-small medium:padding-small'>
          <div className='flex flex-col items-center gap-small'>
            <span className='text-label-medium content-emphasis text-align-x-center medium:text-label-large'>
              {translate('Heading.NoVideoUploaded')}
            </span>
            <span className='text-body-small content-default max-width-[300px] text-align-x-center [font-size:var(--font-size-250)] medium:[font-size:var(--font-size-300)]'>
              {translate('Description.UploadGamePreviewVideo')}
            </span>
          </div>
          <Button
            as='a'
            href={href}
            variant='Standard'
            size='XSmall'
            className='medium:radius-medium medium:height-800'>
            {translate('Action.VideoUploadContinue')}
          </Button>
        </div>
      </div>
    );
  }

  if (status === GamePreviewVideoTileStatus.Approved && videoPreviewId != null) {
    return (
      <div className='width-full height-full [&>div]:width-full [&>div]:height-full [&_video]:width-full [&_video]:height-full'>
        <RobloxVideoPlayer
          videoAssetId={videoPreviewId.toString()}
          environment={process.env.targetEnvironment === 'production' ? 'production' : 'sitetest1'}
          src={undefined}
          data-video='true'
        />
      </div>
    );
  }

  const { headingKey, icon } = getStatusPresentation(status);

  return (
    <div className='flex height-full items-center justify-center'>
      <div className='flex flex-col items-center gap-xsmall padding-xsmall medium:gap-medium medium:padding-small'>
        <div className='flex flex-col items-center gap-small'>
          <Icon name={icon} size='XXLarge' className='content-default' />
          <span className='text-label-medium content-emphasis text-align-x-center medium:text-label-large'>
            {translate(headingKey)}
          </span>
        </div>
        <Button
          as='a'
          href={href}
          variant='Standard'
          size='XSmall'
          className='medium:radius-medium medium:height-800'>
          {translate('Action.ViewDetails')}
        </Button>
      </div>
    </div>
  );
};

export default GamePreviewVideoTileBody;

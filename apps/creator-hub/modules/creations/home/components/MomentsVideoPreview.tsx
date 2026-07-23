import type { FC, ReactNode } from 'react';

type MomentsVideoPreviewProps = {
  thumbnailUrl?: string;
  videoUrl?: string;
};

const previewContainerClassName =
  'flex items-center justify-center radius-medium bg-surface-200 width-full shrink-0 overflow-hidden h-[240px]';
const previewMediaClassName = 'block width-full height-full max-w-full max-h-full object-contain';

const MomentsVideoPreviewContainer: FC<{ children?: ReactNode }> = ({ children }) => (
  <div className={previewContainerClassName} data-testid='moments-video-preview-container'>
    {children}
  </div>
);

const MomentsVideoPreview: FC<MomentsVideoPreviewProps> = ({ thumbnailUrl, videoUrl }) => {
  if (videoUrl) {
    return (
      <MomentsVideoPreviewContainer>
        <video
          aria-label='Moment video preview'
          className={`radius-medium ${previewMediaClassName}`}
          controls
          playsInline
          poster={thumbnailUrl}
          src={videoUrl}>
          <track kind='captions' />
        </video>
      </MomentsVideoPreviewContainer>
    );
  }

  if (thumbnailUrl) {
    return (
      <MomentsVideoPreviewContainer>
        <img
          alt='Moment thumbnail preview'
          className={`radius-medium ${previewMediaClassName}`}
          src={thumbnailUrl}
        />
      </MomentsVideoPreviewContainer>
    );
  }

  return <MomentsVideoPreviewContainer />;
};

export default MomentsVideoPreview;

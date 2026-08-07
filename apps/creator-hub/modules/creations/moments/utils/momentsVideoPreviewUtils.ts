const VIDEO_THUMBNAIL_SEEK_SECONDS = 0.1;
const VIDEO_THUMBNAIL_JPEG_QUALITY = 0.82;

const loadVideoMetadata = (video: HTMLVideoElement, objectUrl: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.addEventListener('loadeddata', () => {
      video.currentTime = VIDEO_THUMBNAIL_SEEK_SECONDS;
    });

    video.addEventListener(
      'seeked',
      () => {
        resolve();
      },
      { once: true },
    );

    video.addEventListener(
      'error',
      () => {
        reject(new Error('Failed to load video for thumbnail generation'));
      },
      { once: true },
    );

    video.src = objectUrl;
    video.load();
  });
};

/** Captures the first frame of a video file as a JPEG blob. */
export const generateVideoThumbnailBlob = async (file: File): Promise<Blob> => {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');

  try {
    await loadVideoMetadata(video, objectUrl);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1;
    canvas.height = video.videoHeight || 1;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to create canvas context for thumbnail generation');
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const thumbnailBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
            return;
          }

          reject(new Error('Failed to encode video thumbnail'));
        },
        'image/jpeg',
        VIDEO_THUMBNAIL_JPEG_QUALITY,
      );
    });

    return thumbnailBlob;
  } finally {
    URL.revokeObjectURL(objectUrl);
    video.removeAttribute('src');
    video.load();
  }
};

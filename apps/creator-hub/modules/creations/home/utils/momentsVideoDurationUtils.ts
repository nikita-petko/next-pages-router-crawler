function loadVideoDuration(video: HTMLVideoElement, objectUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.addEventListener(
      'loadedmetadata',
      () => {
        const duration = video.duration;
        if (!Number.isFinite(duration) || duration <= 0) {
          reject(new Error('Video duration is unavailable'));
          return;
        }

        resolve(duration);
      },
      { once: true },
    );

    video.addEventListener(
      'error',
      () => {
        reject(new Error('Failed to load video duration'));
      },
      { once: true },
    );

    video.src = objectUrl;
  });
}

/** Reads the duration of a local video file in seconds. */
export async function getVideoDurationSeconds(file: File): Promise<number> {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');

  try {
    return await loadVideoDuration(video, objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
    video.removeAttribute('src');
    video.load();
  }
}

import { Platform, getCurrentPlatform } from '@rbx/core';
import { windowsDownloadURL, macOSDownloadURL } from '../constants/urlConstants';

// eslint-disable-next-line import/prefer-default-export
export const getDownloadUrl = () => {
  const currentPlatform = getCurrentPlatform();
  switch (currentPlatform) {
    case Platform.Windows:
      return windowsDownloadURL;
    case Platform.macOS:
      return macOSDownloadURL;
    default:
      return null;
  }
};

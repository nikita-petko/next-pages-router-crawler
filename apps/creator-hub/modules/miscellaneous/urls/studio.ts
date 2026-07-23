import { Platform, getCurrentPlatform } from '@rbx/core';
import { windowsDownloadURL, macOSDownloadURL } from '../common/constants/urlConstants';

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

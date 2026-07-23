import { getCurrentPlatform, Platform } from '@rbx/core';
import type { TRobloxEnvironment, TRobloxTarget } from '../types';
import { RobloxEnvironment, RobloxTarget } from '../types';

const LUOBU_DOWNLOAD_BASE_PATH = 'https://setup.c.robloxdev.cn';
const luobuWindowsDownloadURL = `${LUOBU_DOWNLOAD_BASE_PATH}/cjv/RobloxStudioInstallerCJV.exe`;
const luobuMacOSDownloadURL = `${LUOBU_DOWNLOAD_BASE_PATH}/mac/cjv/RobloxStudioCJV.dmg`;

const getDownloadUrl = (env: TRobloxEnvironment, target: TRobloxTarget) => {
  const platform = getCurrentPlatform();
  if (target === RobloxTarget.Luobu) {
    if (platform === Platform.macOS) {
      return luobuMacOSDownloadURL;
    }

    return luobuWindowsDownloadURL;
  }

  if (env === RobloxEnvironment.Production) {
    return 'https://www.roblox.com/download/studio';
  }

  return `https://www.${env}.robloxlabs.com/download/studio`;
};

export default getDownloadUrl;

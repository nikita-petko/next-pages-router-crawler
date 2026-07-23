import { device, Platform } from '@rbx/core';

import { EClientBinaryType } from '@clients/channel';

const { getCurrentPlatform } = device;

type TStudioProtocolScheme =
  | 'roblox-studio-sitetest3'
  | 'roblox-studio-sitetest2'
  | 'roblox-studio-sitetest1'
  | 'roblox-studio'
  | 'roblox-studio-qq';

export const getStudioDistributorType = (): 'Global' => {
  return 'Global';
};

export const getStudioBinaryType = (): EClientBinaryType => {
  const currentPlatform = getCurrentPlatform();

  if (currentPlatform === Platform.macOS) {
    return EClientBinaryType.MacStudio;
  }
  return EClientBinaryType.WindowsStudio;
};

export const getStudioProtocolScheme = (): TStudioProtocolScheme => {
  const currentPlatform = getCurrentPlatform();

  if (process.env.studioProtocol === 'roblox-studio-qq' && currentPlatform !== Platform.Windows) {
    return 'roblox-studio';
  }

  return process.env.studioProtocol as TStudioProtocolScheme;
};

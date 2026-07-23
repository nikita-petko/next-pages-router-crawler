interface DownloadURLs {
  windowsDownloadURL: string;
  macOSDownloadURL: string;
}

const LUOBU_DOWNLOAD_BASE_PATH = 'https://setup.c.robloxdev.cn';
const GLOBAL_DOWNLOAD_BASE_PATH =
  process.env.targetEnvironment === 'production'
    ? 'https://setup.rbxcdn.com'
    : `https://s3.amazonaws.com/setup.${process.env.robloxSiteDomain}`;

const luobuWindowsDownloadURL = `${LUOBU_DOWNLOAD_BASE_PATH}/cjv/RobloxStudioInstallerCJV.exe`;
const luobuMacOSDownloadURL = `${LUOBU_DOWNLOAD_BASE_PATH}/mac/cjv/RobloxStudioCJV.dmg`;

const globalWindowsDownloadURL = `${GLOBAL_DOWNLOAD_BASE_PATH}/RobloxStudioInstaller.exe`;
const globalMacOSDownloadURL = `${GLOBAL_DOWNLOAD_BASE_PATH}/mac/RobloxStudio.dmg`;

const downloadURLs: DownloadURLs =
  process.env.buildTarget === 'luobu'
    ? {
        windowsDownloadURL: luobuWindowsDownloadURL,
        macOSDownloadURL: luobuMacOSDownloadURL,
      }
    : {
        windowsDownloadURL: globalWindowsDownloadURL,
        macOSDownloadURL: globalMacOSDownloadURL,
      };

export const { windowsDownloadURL, macOSDownloadURL } = downloadURLs;

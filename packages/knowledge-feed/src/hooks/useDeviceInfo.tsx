import { useEffect, useMemo, useState } from 'react';
import { device, Platform } from '@rbx/core';

const { getCurrentPlatform, getCurrentBrowser } = device;

export default function useDeviceInfo() {
  const [currentBrowser, setCurrentBrowser] = useState<ReturnType<typeof getCurrentBrowser>>();

  const currentPlatform = useMemo(() => getCurrentPlatform(), []);

  useEffect(() => {
    setCurrentBrowser(getCurrentBrowser());
  }, []);

  const isMobileDevice = useMemo(
    () => currentPlatform === Platform.Android || currentPlatform === Platform.iOS,
    [currentPlatform],
  );

  return { isMobileDevice, currentPlatform, currentBrowser };
}

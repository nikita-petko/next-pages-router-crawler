import { useEffect } from 'react';
import { maintenanceMiddleware } from '@rbx/clients-core';

const MAINTENANCE_URLS = [
  'https://users.roblox.com/v1/users/authenticated',
  'https://users.sitetest1.robloxlabs.com/v1/users/authenticated',
  'https://users.sitetest2.robloxlabs.com/v1/users/authenticated',
  'https://users.sitetest3.robloxlabs.com/v1/users/authenticated',
];

const useMaintenanceObserver = (baseUrl: string) => {
  const redirect = (url: string) => {
    const {
      location: { pathname },
    } = window;

    if (
      pathname !== '/' &&
      pathname !== '/landing' &&
      pathname !== '/roadmap' &&
      pathname !== '/maintenance' &&
      !pathname.startsWith('/docs') &&
      MAINTENANCE_URLS.includes(url)
    ) {
      window.location.replace(`${baseUrl}/maintenance`);
    }
  };

  useEffect(() => {
    maintenanceMiddleware.subscribe(redirect);
    return () => {
      maintenanceMiddleware.unsubscribe(redirect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default useMaintenanceObserver;

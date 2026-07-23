import { useCallback, useState } from 'react';

export type NavigationDrawerState = {
  homeDrawerOpen: boolean;
  toggleHomeDrawerOpen: (open: boolean) => void;
  productNavigationDrawerOpen: boolean;
  toggleProductNavigationDrawer: (open: boolean) => void;
};

export const defaultNavigationDrawerState: NavigationDrawerState = {
  homeDrawerOpen: false,
  toggleHomeDrawerOpen: () => {
    throw new Error('Not implemented');
  },
  productNavigationDrawerOpen: false,
  toggleProductNavigationDrawer: () => {
    throw new Error('Not implemented');
  },
};

export default function useNavigationDrawerState(): NavigationDrawerState {
  const [homeDrawerOpen, setHomeDrawerOpen] = useState(false);
  const [productNavigationDrawerOpen, setProductNavigationDrawerOpen] = useState(false);
  const toggleProductNavigationDrawer = useCallback(
    (open: boolean) => {
      setProductNavigationDrawerOpen(open);
      if (open === false) {
        // close home drawer too
        setHomeDrawerOpen(false);
      }
    },
    [setProductNavigationDrawerOpen, setHomeDrawerOpen],
  );
  const toggleHomeDrawerOpen = useCallback(
    (open: boolean) => {
      setHomeDrawerOpen(open);
      if (open === false) {
        // close product navigation drawer too
        setProductNavigationDrawerOpen(false);
      }
    },
    [setHomeDrawerOpen, setProductNavigationDrawerOpen],
  );
  return {
    homeDrawerOpen,
    toggleHomeDrawerOpen,
    productNavigationDrawerOpen,
    toggleProductNavigationDrawer,
  };
}

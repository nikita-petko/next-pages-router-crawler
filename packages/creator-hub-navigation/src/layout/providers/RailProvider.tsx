import React, {
  createContext,
  useContext,
  PropsWithChildren,
  useMemo,
  useEffect,
  useCallback,
  useReducer,
  useState,
  useRef,
} from 'react';
import { useMediaQuery } from '@rbx/ui';
import railReducer, { createInitialState, ScreenSize } from './RailReducer';
import { COMPACT_TRANSITION_DURATION } from '../constants';

type TRailProviderContext = {
  primaryRailOpen: boolean;
  primaryRailCompact: boolean;
  drawerVariant: 'temporary' | 'persistent';
  hasSecondaryRail: boolean;
  allToolsOpen: boolean;
  learnOpen: boolean;
  isReady: boolean;
  shouldAnimate: boolean;
  setHasSecondaryRail: (collapsed: boolean) => void;
  setPrimaryRailCompact: (compact: boolean) => void;
  setPrimaryRailOpen: (open: boolean) => void;
  setAllToolsOpen: (open: boolean) => void;
  setLearnOpen: (open: boolean) => void;
  setLearnNavigatedFromCreatorHub: () => void;
};

const RailProviderContext = createContext<TRailProviderContext>({
  primaryRailOpen: false,
  primaryRailCompact: false,
  hasSecondaryRail: false,
  drawerVariant: 'persistent',
  learnOpen: false,
  allToolsOpen: false,
  isReady: false,
  shouldAnimate: false,
  setHasSecondaryRail: () => {},
  setPrimaryRailCompact: () => {},
  setPrimaryRailOpen: () => {},
  setAllToolsOpen: () => {},
  setLearnOpen: () => {},
  setLearnNavigatedFromCreatorHub: () => {},
});

export const useRailContext = () => {
  const context = useContext(RailProviderContext);

  return context;
};

const UNMOUNT_DEBOUNCE_MS = 50;

export const RailProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const isLessThenLarge = useMediaQuery((theme) => theme.breakpoints.down('Large'));
  const isLessThenMedium = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const [isReady, setIsReady] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const secondaryRailRef = useRef<{
    committed: boolean | null;
    unmountTimer: ReturnType<typeof setTimeout> | null;
  }>({ committed: null, unmountTimer: null });

  let screenSize: ScreenSize = 'large';
  if (isLessThenMedium) {
    screenSize = 'small';
  } else if (isLessThenLarge) {
    screenSize = 'medium';
  }

  const [state, dispatch] = useReducer(
    railReducer,
    createInitialState({
      screenSize,
    }),
  );

  useEffect(() => {
    dispatch({ type: 'setScreenSize', payload: screenSize });
  }, [screenSize]);

  const animateTransition = useCallback(() => {
    setShouldAnimate(true);
    setTimeout(() => setShouldAnimate(false), COMPACT_TRANSITION_DURATION);
  }, []);

  const setHasSecondaryRail = useCallback(
    (value: boolean) => {
      const ref = secondaryRailRef.current;

      // Clear any pending unmount
      if (ref.unmountTimer) {
        clearTimeout(ref.unmountTimer);
        ref.unmountTimer = null;
      }

      // First call - initialize without animation
      if (ref.committed === null) {
        ref.committed = value;
        dispatch({ type: 'setSecondaryRail', payload: value });
        setTimeout(() => setIsReady(true));
        return;
      }

      if (value) {
        // Mount: animate only if committed was false (real expand)
        // If there was a pending unmount, this is rail→rail, skip animation
        if (ref.committed === false) {
          animateTransition();
        }
        ref.committed = true;
        dispatch({ type: 'setSecondaryRail', payload: true });
      } else {
        // Unmount: debounce to detect rail→rail transitions
        ref.unmountTimer = setTimeout(() => {
          ref.committed = false;
          animateTransition();
          dispatch({ type: 'setSecondaryRail', payload: false });
        }, UNMOUNT_DEBOUNCE_MS);
      }
    },
    [animateTransition],
  );

  const setLearnOpen = useCallback((open: boolean) => {
    dispatch({ type: 'setLearn', payload: open });
  }, []);

  const setAllToolsOpen = useCallback((open: boolean) => {
    dispatch({ type: 'setAllTools', payload: open });
  }, []);

  const setPrimaryRailOpen = useCallback((open: boolean) => {
    dispatch({ type: 'setPrimaryRailOpen', payload: open });
  }, []);

  const setPrimaryRailCompact = useCallback(
    (value: boolean) => {
      animateTransition();
      dispatch({ type: 'setPrimaryRailCompact', payload: value });
    },
    [animateTransition],
  );

  const setLearnNavigatedFromCreatorHub = useCallback(() => {
    dispatch({ type: 'setLearnNavigatedFromCreatorHub' });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      isReady,
      shouldAnimate,
      setHasSecondaryRail,
      setPrimaryRailCompact,
      setPrimaryRailOpen,
      setLearnOpen,
      setLearnNavigatedFromCreatorHub,
      setAllToolsOpen,
    }),
    [
      isReady,
      shouldAnimate,
      setAllToolsOpen,
      setHasSecondaryRail,
      setLearnOpen,
      setLearnNavigatedFromCreatorHub,
      setPrimaryRailCompact,
      setPrimaryRailOpen,
      state,
    ],
  );

  return <RailProviderContext.Provider value={value}>{children}</RailProviderContext.Provider>;
};

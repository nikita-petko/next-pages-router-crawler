import { RAIL_ICON_ONLY_STORAGE_KEY } from '../constants';

type DrawerVariant = 'temporary' | 'persistent';
export type ScreenSize = 'small' | 'medium' | 'large';

export type RailState = {
  primaryRailOpen: boolean;
  primaryRailCompact: boolean;
  iconOnly: boolean;
  drawerVariant: DrawerVariant;
  hasSecondaryRail: boolean;
  allToolsOpen: boolean;
  learnOpen: boolean;
  learnNavigatedFromCreatorHub: boolean;
  screenSize: ScreenSize;
};

export type RailAction =
  | { type: 'setPrimaryRailOpen'; payload: boolean }
  | { type: 'setPrimaryRailCompact'; payload: boolean }
  | { type: 'setIconOnly'; payload: boolean }
  | { type: 'setScreenSize'; payload: ScreenSize }
  | { type: 'setSecondaryRail'; payload: boolean }
  | { type: 'setAllTools'; payload: boolean }
  | { type: 'setLearn'; payload: boolean }
  | { type: 'setLearnNavigatedFromCreatorHub' };

const getStoredIconOnly = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return localStorage.getItem(RAIL_ICON_ONLY_STORAGE_KEY) === 'true';
};

export const createInitialState = ({ screenSize }: { screenSize: ScreenSize }): RailState => {
  return {
    primaryRailOpen: screenSize === 'large',
    primaryRailCompact: false,
    iconOnly: getStoredIconOnly(),
    drawerVariant: screenSize === 'large' ? 'persistent' : 'temporary',
    hasSecondaryRail: false,
    allToolsOpen: false,
    learnOpen: false,
    learnNavigatedFromCreatorHub: false,
    screenSize,
  };
};

function railReducer(state: Readonly<RailState>, action: RailAction): RailState {
  switch (action.type) {
    case 'setPrimaryRailOpen':
      if (action.payload) {
        return { ...state, primaryRailOpen: action.payload };
      }
      return { ...state, primaryRailOpen: action.payload, allToolsOpen: false, learnOpen: false };
    case 'setPrimaryRailCompact': {
      return { ...state, primaryRailCompact: action.payload };
    }
    case 'setIconOnly': {
      return { ...state, iconOnly: action.payload };
    }
    case 'setScreenSize': {
      const drawerVariant = action.payload === 'large' ? 'persistent' : 'temporary';
      const primaryRailOpen = drawerVariant !== 'temporary';
      let { primaryRailCompact } = state;
      if (!state.learnNavigatedFromCreatorHub) {
        primaryRailCompact = action.payload === 'large' ? false : state.hasSecondaryRail;
      }

      return {
        ...state,
        allToolsOpen: false,
        drawerVariant,
        primaryRailCompact,
        primaryRailOpen,
        screenSize: action.payload,
      };
    }
    case 'setSecondaryRail': {
      const nextState = {
        drawerVariant: state.screenSize === 'large' ? 'persistent' : 'temporary',
        hasSecondaryRail: action.payload,
      } as Partial<RailState>;

      if (!state.learnNavigatedFromCreatorHub && state.screenSize !== 'large') {
        nextState.primaryRailCompact = action.payload;
      }

      return { ...state, ...nextState };
    }
    case 'setAllTools': {
      const nextState = {
        allToolsOpen: action.payload,
      } as Partial<RailState>;

      if (action.payload) {
        nextState.learnOpen = false;
      }

      if (!state.learnNavigatedFromCreatorHub) {
        if (state.screenSize === 'small') {
          nextState.primaryRailCompact = action.payload || state.hasSecondaryRail;
        }
      }

      return { ...state, ...nextState };
    }
    case 'setLearn': {
      let { allToolsOpen, primaryRailCompact } = state;
      if (action.payload) {
        allToolsOpen = false;
      }
      if (state.screenSize === 'small') {
        primaryRailCompact = action.payload || state.hasSecondaryRail;
      }

      return { ...state, primaryRailCompact, allToolsOpen, learnOpen: action.payload };
    }
    case 'setLearnNavigatedFromCreatorHub': {
      return {
        ...state,
        learnNavigatedFromCreatorHub: true,
        learnOpen: true,
        primaryRailCompact: true,
      };
    }
    default:
      return state;
  }
}

export default railReducer;

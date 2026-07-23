import { makeStyles } from '@rbx/ui';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export interface DevToolsDockPosition {
  x: number;
  y: number;
}

export type DevToolsDockItem = 'default' | 'metadataOverrides';

interface DevToolsDockContextValue {
  activeItem: DevToolsDockItem | null;
  persistPosition: (position: DevToolsDockPosition) => void;
  position: DevToolsDockPosition | null;
  registeredItems: ReadonlySet<DevToolsDockItem>;
  registerItem: (item: DevToolsDockItem) => () => void;
  setActiveItem: Dispatch<SetStateAction<DevToolsDockItem | null>>;
  setPosition: Dispatch<SetStateAction<DevToolsDockPosition | null>>;
  updateBoundedPosition: (position: DevToolsDockPosition) => DevToolsDockPosition;
}

interface DevToolsDockProps {
  children: ReactNode;
}

export const DEV_TOOLS_DOCK_ITEM_OFFSET = 60;
export const DEV_TOOLS_DOCK_PADDING = 9;

const DOCK_ITEM_SIZE = 56;
const DOCK_RIGHT = 20;
const DOCK_TOP = 20;
const DOCK_VIEWPORT_MARGIN = 8;
const POSITION_STORAGE_KEY = 'devtools-dock-position';

const DevToolsDockContext = createContext<DevToolsDockContextValue | null>(null);

interface DevToolsDockStyleParams {
  height: number;
  left: number;
  top: number;
}

const useDevToolsDockStyles = makeStyles<DevToolsDockStyleParams>()((theme, params) => ({
  rail: {
    backdropFilter: 'blur(28px) saturate(1.35)',
    background:
      'linear-gradient(145deg, rgba(255, 224, 128, 0.28) 0%, rgba(255, 193, 7, 0.14) 52%, rgba(255, 193, 7, 0.06) 100%)',
    borderRadius: '999px',
    boxShadow:
      '0 10px 30px rgba(0, 0, 0, 0.28), 0 2px 8px rgba(0, 0, 0, 0.2), inset 6px 6px 16px rgba(255, 255, 255, 0.08), inset -6px -6px 16px rgba(0, 0, 0, 0.16)',
    height: `${params.height + DEV_TOOLS_DOCK_PADDING * 2}px`,
    left: `${params.left - DEV_TOOLS_DOCK_PADDING}px`,
    pointerEvents: 'none',
    position: 'fixed',
    top: `${params.top - DEV_TOOLS_DOCK_PADDING}px`,
    WebkitBackdropFilter: 'blur(28px) saturate(1.35)',
    width: `${DOCK_ITEM_SIZE + DEV_TOOLS_DOCK_PADDING * 2}px`,
    zIndex: theme.zIndex.modal + 9,
  },
}));

const getDockHeight = (itemCount: number): number =>
  DOCK_ITEM_SIZE + Math.max(0, itemCount - 1) * DEV_TOOLS_DOCK_ITEM_OFFSET;

const clampPosition = (
  position: DevToolsDockPosition,
  dockHeight: number,
): DevToolsDockPosition => ({
  x: Math.min(
    Math.max(DOCK_VIEWPORT_MARGIN + DEV_TOOLS_DOCK_PADDING, position.x),
    Math.max(
      DOCK_VIEWPORT_MARGIN + DEV_TOOLS_DOCK_PADDING,
      window.innerWidth - DOCK_ITEM_SIZE - DEV_TOOLS_DOCK_PADDING - DOCK_VIEWPORT_MARGIN,
    ),
  ),
  y: Math.min(
    Math.max(DOCK_VIEWPORT_MARGIN + DEV_TOOLS_DOCK_PADDING, position.y),
    Math.max(
      DOCK_VIEWPORT_MARGIN + DEV_TOOLS_DOCK_PADDING,
      window.innerHeight - dockHeight - DEV_TOOLS_DOCK_PADDING - DOCK_VIEWPORT_MARGIN,
    ),
  ),
});

const getDefaultPosition = (): DevToolsDockPosition => ({
  x: window.innerWidth - DOCK_ITEM_SIZE - DOCK_RIGHT,
  y: DOCK_TOP,
});

const readPosition = (): DevToolsDockPosition | null => {
  try {
    const rawValue = window.localStorage.getItem(POSITION_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }
    const parsedValue = JSON.parse(rawValue);
    if (
      typeof parsedValue !== 'object' ||
      parsedValue === null ||
      typeof parsedValue.x !== 'number' ||
      typeof parsedValue.y !== 'number'
    ) {
      return null;
    }
    return parsedValue;
  } catch {
    return null;
  }
};

const writePosition = (position: DevToolsDockPosition): void => {
  try {
    window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
  } catch {
    // Ignore storage write errors in private mode or restrictive browser settings.
  }
};

const DevToolsDock = ({ children }: DevToolsDockProps) => {
  const [activeItem, setActiveItem] = useState<DevToolsDockItem | null>(null);
  const [position, setPosition] = useState<DevToolsDockPosition | null>(null);
  const [registeredItems, setRegisteredItems] = useState<Set<DevToolsDockItem>>(() => new Set());
  const dockHeight = getDockHeight(registeredItems.size);
  const {
    classes: { rail },
  } = useDevToolsDockStyles({
    height: dockHeight,
    left: position?.x ?? 0,
    top: position?.y ?? 0,
  });

  const persistPosition = useCallback((nextPosition: DevToolsDockPosition): void => {
    writePosition(nextPosition);
  }, []);

  const updateBoundedPosition = useCallback(
    (nextPosition: DevToolsDockPosition): DevToolsDockPosition => {
      const boundedPosition = clampPosition(nextPosition, dockHeight);
      setPosition(boundedPosition);
      return boundedPosition;
    },
    [dockHeight],
  );

  const registerItem = useCallback((item: DevToolsDockItem): (() => void) => {
    setRegisteredItems((currentItems) => {
      if (currentItems.has(item)) {
        return currentItems;
      }
      const nextItems = new Set(currentItems);
      nextItems.add(item);
      return nextItems;
    });

    return () => {
      setRegisteredItems((currentItems) => {
        if (!currentItems.has(item)) {
          return currentItems;
        }
        const nextItems = new Set(currentItems);
        nextItems.delete(item);
        return nextItems;
      });
      setActiveItem((currentItem) => (currentItem === item ? null : currentItem));
    };
  }, []);

  useEffect(() => {
    const storedPosition = readPosition();
    const initialPosition = clampPosition(storedPosition ?? getDefaultPosition(), DOCK_ITEM_SIZE);
    setPosition(initialPosition);
    if (!storedPosition) {
      persistPosition(initialPosition);
    }
  }, [persistPosition]);

  useEffect(() => {
    setPosition((currentPosition) => {
      if (!currentPosition) {
        return currentPosition;
      }
      const boundedPosition = clampPosition(currentPosition, dockHeight);
      if (boundedPosition.x !== currentPosition.x || boundedPosition.y !== currentPosition.y) {
        persistPosition(boundedPosition);
      }
      return boundedPosition;
    });
  }, [dockHeight, persistPosition]);

  useEffect(() => {
    const handleResize = (): void => {
      setPosition((currentPosition) => {
        if (!currentPosition) {
          return currentPosition;
        }
        const boundedPosition = clampPosition(currentPosition, dockHeight);
        persistPosition(boundedPosition);
        return boundedPosition;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [dockHeight, persistPosition]);

  const value = useMemo<DevToolsDockContextValue>(
    () => ({
      activeItem,
      persistPosition,
      position,
      registeredItems,
      registerItem,
      setActiveItem,
      setPosition,
      updateBoundedPosition,
    }),
    [activeItem, persistPosition, position, registerItem, registeredItems, updateBoundedPosition],
  );

  return (
    <DevToolsDockContext.Provider value={value}>
      {position && registeredItems.size > 0 ? (
        <div
          aria-hidden
          className={rail}
          data-dev-tools-dock-rail
          data-dock-item-count={registeredItems.size}
          data-dock-left={position.x}
          data-dock-top={position.y}
        />
      ) : null}
      {children}
    </DevToolsDockContext.Provider>
  );
};

export const useDevToolsDock = (): DevToolsDockContextValue | null =>
  useContext(DevToolsDockContext);

export default DevToolsDock;

import React, {
  FunctionComponent,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useLocalStorage } from '@rbx/react-utilities';
import {
  ThemeMode,
  ThemeOption,
  themeOptionLocalStorageKey,
  themeModeLocalStorageKey,
  defaultThemeOption,
  defaultThemeMode,
} from '../constants/themeConstants';
import { convertThemeOptionToMode, getThemeOption, updateThemeOption } from '../utils/helperUtils';
import createCreatorSettingsClient from '../clients/creatorSettingsClient';
import createUserSettingsClient from '../clients/usersSettingsClient';
import { User } from '../types';

type TThemeModeContext = {
  themeOption: ThemeOption;
  themeMode: ThemeMode;
  updateThemeMode: (themeOption: ThemeOption) => Promise<boolean>;
};

export const ThemeModeContext = createContext<TThemeModeContext>({
  themeMode: defaultThemeMode,
  themeOption: defaultThemeOption,
  updateThemeMode: () => Promise.resolve(false),
});

type ThemeModeProviderProps = {
  currentUser: User | null;
  bedev2BaseUrl: string;
  children?: React.ReactNode;
};

const ThemeModeProvider: FunctionComponent<ThemeModeProviderProps> = ({
  currentUser,
  bedev2BaseUrl,
  children,
}) => {
  const [themeOption, setThemeOption] = useLocalStorage<ThemeOption>(
    themeOptionLocalStorageKey,
    defaultThemeOption,
  );
  const [themeMode, setThemeMode] = useLocalStorage<ThemeMode>(
    themeModeLocalStorageKey,
    defaultThemeMode,
  );

  const systemMediaQuery = useRef<MediaQueryList | null>(null);
  const systemPreferenceChangeHandler = useRef<((e: MediaQueryListEvent) => void) | null>(null);

  const creatorSettingsClient = useMemo(
    () => createCreatorSettingsClient(bedev2BaseUrl),
    [bedev2BaseUrl],
  );
  const userSettingsClient = useMemo(
    () => createUserSettingsClient(bedev2BaseUrl),
    [bedev2BaseUrl],
  );

  const updateThemeMode = useCallback(
    async (newThemeOption: ThemeOption): Promise<boolean> => {
      try {
        const updatedThemeOption = await updateThemeOption(
          creatorSettingsClient,
          newThemeOption,
          currentUser?.id,
        );

        if (updatedThemeOption !== null) {
          const updatedThemeMode = await convertThemeOptionToMode(
            userSettingsClient,
            updatedThemeOption,
          );

          setThemeOption(updatedThemeOption);
          setThemeMode(updatedThemeMode);

          return true;
        }
      } catch {
        // let it fall through
      }

      return false;
    },
    [creatorSettingsClient, currentUser?.id, setThemeMode, setThemeOption, userSettingsClient],
  );

  const themeModeContextValue = useMemo(
    () => ({
      themeOption,
      themeMode,
      updateThemeMode,
    }),
    [themeMode, themeOption, updateThemeMode],
  );

  useEffect(() => {
    const initializeThemeMode = async () => {
      const currentThemeOption = await getThemeOption(creatorSettingsClient, currentUser?.id);

      if (currentThemeOption !== null) {
        const currentThemeMode = await convertThemeOptionToMode(
          userSettingsClient,
          currentThemeOption,
        );

        setThemeOption(currentThemeOption);
        setThemeMode(currentThemeMode);
      }
    };

    initializeThemeMode();
  }, [creatorSettingsClient, currentUser?.id, setThemeMode, setThemeOption, userSettingsClient]);

  useEffect(() => {
    if (!systemMediaQuery.current) {
      systemMediaQuery.current = window.matchMedia('(prefers-color-scheme: dark)');
    }

    if (!systemPreferenceChangeHandler.current) {
      systemPreferenceChangeHandler.current = (darkModeMediaQuery: MediaQueryListEvent) => {
        setThemeMode(darkModeMediaQuery.matches ? 'dark' : 'light');
      };
    }

    if (themeOption === ThemeOption.SyncDevice) {
      systemMediaQuery.current.addEventListener('change', systemPreferenceChangeHandler.current);
    }

    return () => {
      if (systemMediaQuery.current && systemPreferenceChangeHandler.current) {
        systemMediaQuery.current.removeEventListener(
          'change',
          systemPreferenceChangeHandler.current,
        );
      }
    };
  }, [setThemeMode, themeOption]);

  return (
    <ThemeModeContext.Provider value={themeModeContextValue}>{children}</ThemeModeContext.Provider>
  );
};

export default ThemeModeProvider;

import React, {
  FunctionComponent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useContext,
  createContext,
} from 'react';
import {
  defaultSettings,
  TSettings,
  getClientSettings,
  getIsUserEligibleForDevExSettings,
} from './settingsHelpers';
import TSettingsStatus from '../interfaces/TSettingsStatus';

export type TSettingsContext = TSettingsStatus & {
  settings: TSettings;
};

export const SettingsContext = createContext<TSettingsContext>({
  settings: { ...defaultSettings },
  status: 'initial',
  isFetched: false,
});

export const useSettings = () => {
  const { settings: rawSettings, status, isFetched } = useContext(SettingsContext);

  const stableSettingsRef = useRef(rawSettings);
  const settings = useMemo(() => {
    const prev = stableSettingsRef.current;
    const keys = Object.keys(rawSettings) as Array<keyof TSettings>;
    const changed = keys.some((k) => rawSettings[k] !== prev[k]);
    if (changed) {
      stableSettingsRef.current = rawSettings;
    }
    return stableSettingsRef.current;
  }, [rawSettings]);

  return { settings, status, isFetched };
};

export const SettingsProvider: FunctionComponent<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const [settingsContext, setSettingsContext] = useState<TSettingsContext>(() => ({
    settings: { ...defaultSettings },
    status: 'initial',
    isFetched: false,
  }));

  useEffect(() => {
    const getSettings = async () => {
      const settingsArray = await Promise.allSettled([
        getClientSettings(),
        getIsUserEligibleForDevExSettings(),
      ]);
      const parsedSettings = settingsArray.reduce(
        (acc, curr) => ({
          ...acc,
          ...(curr.status === 'fulfilled' ? curr.value : {}),
        }),
        defaultSettings,
      );
      const settingsStatus = settingsArray.find((setting) => setting.status === 'rejected');
      setSettingsContext({
        settings: parsedSettings,
        isFetched: true,
        status: settingsStatus ? 'error' : 'success',
      });
    };

    getSettings();
  }, []);

  return <SettingsContext.Provider value={settingsContext}>{children}</SettingsContext.Provider>;
};

export default SettingsProvider;

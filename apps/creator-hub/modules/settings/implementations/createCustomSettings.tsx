import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  FunctionComponent,
  useMemo,
  Context,
} from 'react';
import SkippedUpdateError from './SkippedUpdateError';
import CustomSettingsManager from '../interfaces/CustomSettingsManager';
import CustomSettingsManagerWithArgs from '../interfaces/CustomSettingsManagerWithArgs';
import TSettingsStatus from '../interfaces/TSettingsStatus';

// NOTE(shumingxu, 11/10/2023): Keeping T instead of pushing into a field to preserve
// compatibility of existing components. Can do a refactor later to change this.
export type TCustomSettingsWithRequestState<T> = TSettingsStatus & T;

type CustomSettingsContextType<T> = TSettingsStatus & {
  customSettings: T;
};

interface CreateCustomSettingsReturnType<T> {
  CustomSettingsProvider: FunctionComponent<React.PropsWithChildren<unknown>>;
  useCustomSettings: () => TCustomSettingsWithRequestState<T>;
  CustomSettingsContext: Context<CustomSettingsContextType<T>>;
}

function buildCustomSettingsContext<T>(defaultSettings: T, displayName?: string) {
  const CustomSettingsContext = createContext<CustomSettingsContextType<T>>({
    customSettings: defaultSettings,
    status: 'initial',
    isFetched: false,
  });
  CustomSettingsContext.displayName = displayName ?? 'CustomSettings';

  const useCustomSettings = () => {
    const { customSettings, status, isFetched } = useContext(CustomSettingsContext);
    const settings = useMemo(
      () => ({ ...customSettings, status, isFetched }),
      [customSettings, isFetched, status],
    );
    return settings;
  };

  return {
    useCustomSettings,
    CustomSettingsContextProvider: CustomSettingsContext.Provider,
    CustomSettingsContext,
  };
}

export function createCustomSettings<T>(
  customSettingsManager: CustomSettingsManager<T>,
): CreateCustomSettingsReturnType<T> {
  const { useCustomSettings, CustomSettingsContextProvider, CustomSettingsContext } =
    buildCustomSettingsContext(customSettingsManager.defaultSettings, customSettingsManager.name);

  const CustomSettingsProvider: FunctionComponent<React.PropsWithChildren<unknown>> = ({
    children,
  }) => {
    const [customSettings, setCustomSettings] = useState<T>(customSettingsManager.defaultSettings);
    const [status, setStatus] = useState<TSettingsStatus['status']>('initial');
    const [isFetched, setIsFetched] = useState<boolean>(false);

    useEffect(() => {
      async function getCustomSettings() {
        try {
          setStatus('loading');
          const runtimeCustomSettings = await customSettingsManager.getSettings();
          setCustomSettings(runtimeCustomSettings);
          setStatus('success');
          setIsFetched(true);
        } catch {
          const message =
            typeof customSettingsManager.name !== 'undefined'
              ? `Could not fetch custom settings for ${customSettingsManager.name}`
              : 'Could not fetch custom settings';
          // eslint-disable-next-line no-console -- very grandfathered in
          console.warn(message);
          setStatus('error');
          setIsFetched(true);
        }
      }

      getCustomSettings();
    }, []);

    const providerValue = useMemo(
      () => ({ customSettings, status, isFetched }),
      [customSettings, isFetched, status],
    );

    return (
      <CustomSettingsContextProvider value={providerValue}>
        {children}
      </CustomSettingsContextProvider>
    );
  };

  return {
    CustomSettingsProvider,
    useCustomSettings,
    CustomSettingsContext,
  };
}

export function createCustomSettingsWithArgs<T, R extends unknown[]>(
  customSettingsManager: CustomSettingsManagerWithArgs<T, R>,
  useCustomSettingsArgs: () => R,
): CreateCustomSettingsReturnType<T> {
  const { useCustomSettings, CustomSettingsContextProvider, CustomSettingsContext } =
    buildCustomSettingsContext(customSettingsManager.defaultSettings, customSettingsManager.name);

  const CustomSettingsProvider: FunctionComponent<React.PropsWithChildren<unknown>> = ({
    children,
  }) => {
    const customSettingsArgs = useCustomSettingsArgs();
    const [customSettings, setCustomSettings] = useState<T>(customSettingsManager.defaultSettings);
    const [status, setStatus] = useState<TSettingsStatus['status']>('initial');
    const [isFetched, setIsFetched] = useState<boolean>(false);

    /**
     * Note on the dependency array construct of this useEffect block as well as
     * the ESLint disable:
     *
     * What we want here is to have this useEffect block re-run when and only
     * when one or more of the arguments have changed. Therefore the best way to
     * achieve this without requiring the implementation of
     * useCustomSettingsArgs to have memorization built in, is to use the
     * arguments array directly as the dependency array.
     *
     * BTW, this is also why the return type of useCustomSettingsArgs is
     * required to be an array of arguments instead of a key-value paired object
     */
    /* eslint-disable react-hooks/exhaustive-deps -- see "Note on the dependency array" */
    useEffect(() => {
      async function getCustomSettings() {
        try {
          setStatus('loading');
          const runtimeCustomSettings = await customSettingsManager.getSettings(
            ...customSettingsArgs,
          );
          setCustomSettings(runtimeCustomSettings);
          setStatus('success');
          setIsFetched(true);
        } catch (error) {
          // if it's not an intentional skip, log the a warning message
          if (!(error instanceof SkippedUpdateError)) {
            const message =
              typeof customSettingsManager.name !== 'undefined'
                ? `Could not fetch custom settings for ${customSettingsManager.name}`
                : 'Could not fetch custom settings';
            // eslint-disable-next-line no-console -- very grandfathered in
            console.warn(message);
            setStatus('error');
            setIsFetched(true);
          }
        }
      }

      getCustomSettings();
    }, [...customSettingsArgs]);
    /* eslint-enable react-hooks/exhaustive-deps -- see "Note on the dependency array" */

    return (
      <CustomSettingsContextProvider value={{ customSettings, status, isFetched }}>
        {children}
      </CustomSettingsContextProvider>
    );
  };

  return {
    CustomSettingsProvider,
    useCustomSettings,
    CustomSettingsContext,
  };
}

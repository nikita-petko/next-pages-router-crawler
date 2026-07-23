import React, {
  ComponentType,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import TranslationResource from '../interfaces/TranslationResource';
import LocalizationContext from '../LocalizationContext';
import TranslationResourceContext, { TranslationResourceType } from '../TranslationResourceContext';
import translationResourceProviderContext from '../TranslationResourceProviderContext';

// TODO: this could support a fallback UI while the translation resources
// is loading for better user experience
export default function withTranslation<T extends object>(
  WrappedComponent: ComponentType<T>,
  namespaces: string[]
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithTranslation = (props: T) => {
    const localization = useContext(LocalizationContext);
    const { provider } = useContext(translationResourceProviderContext);

    // store translation resources in state
    const [resources, setResources] = useState<TranslationResource | null>(() => {
      let initialTranslationResource: TranslationResource | null = null;
      if (localization?.ready && provider !== null) {
        const {
          localeInfo: { locale },
        } = localization;
        const translationResources = provider.getTranslationResources(namespaces, locale);

        if (translationResources !== null) {
          initialTranslationResource = Object.assign({}, ...translationResources);
        }
      } else {
        if (typeof localization === 'undefined') {
          // eslint-disable-next-line no-console
          console.warn(
            'Localization context is missing, withTranslation cannot work outside of the LocalizationProvider'
          );
        }

        if (provider === null) {
          // eslint-disable-next-line no-console
          console.warn(
            'TranslationResourceProvider context is missing, withTranslation cannot work outside of the TranslationResourceProvider'
          );
        }
      }
      return initialTranslationResource;
    });

    const translationResourceContextValue = useMemo<TranslationResourceType>(
      () => ({ key: displayName, resources, ready: resources !== null }),
      [resources]
    );

    useEffect(() => {
      if (localization?.ready && provider !== null) {
        const {
          localeInfo: { locale },
        } = localization;

        provider
          .loadTranslationResources(namespaces, locale)
          // this will not fail, and will return {} in place where failure occurred
          .then((translationResources) => {
            setResources(Object.assign({}, ...translationResources));
          });
      }
      // shallow comparison here is intended as localization context value is
      // properly memorized, read more in `LocalizationProvider`
    }, [localization, provider]);

    return (
      <TranslationResourceContext.Provider value={translationResourceContextValue}>
        <WrappedComponent {...props} />
      </TranslationResourceContext.Provider>
    );
  };
  WithTranslation.displayName = `WithTranslation(${displayName})`;

  return WithTranslation;
}

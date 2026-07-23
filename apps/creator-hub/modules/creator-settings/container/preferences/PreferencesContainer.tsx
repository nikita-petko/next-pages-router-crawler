import type { FunctionComponent } from 'react';
import React from 'react';
import { buildBreadcrumb, HubMeta } from '@rbx/creator-hub-history';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useAuthentication } from '@modules/authentication/providers';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import DocSiteLanguagePreference from './DocSiteLanguagePreference';
import usePreferencesContainerStyles from './PreferencesContainer.styles';
import ThemePreference from './ThemePreference';

const PreferencesContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const { user } = useAuthentication();

  const {
    classes: { root, section, unauthenticated },
  } = usePreferencesContainerStyles();
  return (
    <div className={`${root} ${user === null ? unauthenticated : ''}`}>
      <HubMeta
        title={translate('Heading.Preferences')}
        breadcrumb={buildBreadcrumb(
          translate('Heading.Settings'),
          translate('Heading.Preferences'),
        )}
      />
      <div className={section}>{user && <ThemePreference />}</div>
      <div className={section}>
        <DocSiteLanguagePreference />
      </div>
    </div>
  );
};

export default withTranslation(PreferencesContainer, [
  TranslationNamespace.Preferences,
  TranslationNamespace.Navigation,
]);

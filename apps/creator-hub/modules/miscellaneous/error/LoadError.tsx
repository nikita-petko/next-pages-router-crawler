import React from 'react';
import { LoadError as CreatorHubLoadError } from '@rbx/creator-hub-error';
import pageLoadFailureIconDark from '@rbx/foundation-images/pictograms/alert_dark.svg';
import pageLoadFailureIconLight from '@rbx/foundation-images/pictograms/alert_light.svg';
import { withTranslation } from '@rbx/intl';
import { useThemeMode } from '@rbx/settings';
import { TranslationNamespace } from '../localization';

type TLoadErrorProps = {
  onReload: VoidFunction;
};

const LoadError: React.FC<TLoadErrorProps> = ({ onReload }) => {
  const { themeMode } = useThemeMode();
  const illustrationPath =
    themeMode === 'dark' ? pageLoadFailureIconDark : pageLoadFailureIconLight;
  return <CreatorHubLoadError src={illustrationPath} onReload={onReload} />;
};

export default withTranslation(LoadError, [TranslationNamespace.Error]);

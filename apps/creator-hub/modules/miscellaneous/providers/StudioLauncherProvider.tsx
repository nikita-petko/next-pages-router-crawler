import type { FunctionComponent, PropsWithChildren } from 'react';
import React from 'react';
import { NavigationStudioLauncherProvider } from '@rbx/creator-hub-navigation';
import { withTranslation } from '@rbx/intl';
import useStudio from '../hooks/useStudio';
import { TranslationNamespace } from '../localization';

const StudioLauncherProvider: FunctionComponent<PropsWithChildren> = ({ children }) => {
  const { open, dialog } = useStudio();
  return (
    <NavigationStudioLauncherProvider openStudio={open}>
      {children}
      {dialog}
    </NavigationStudioLauncherProvider>
  );
};

export default withTranslation(StudioLauncherProvider, [TranslationNamespace.Creations]);

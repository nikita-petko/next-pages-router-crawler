import { UIThemeProvider } from '@rbx/ui';
import React, { ComponentType, FunctionComponent } from 'react';

export default function withTheme<T extends React.JSX.IntrinsicAttributes | object>(
  WrappedComponent: ComponentType<T>,
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithNavigationWrapper: FunctionComponent<T> = (props) => {
    return (
      <UIThemeProvider>
        <WrappedComponent {...props} />
      </UIThemeProvider>
    );
  };
  WithNavigationWrapper.displayName = `withTheme(${displayName})`;

  return WithNavigationWrapper;
}

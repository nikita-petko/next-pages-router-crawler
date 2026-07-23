import type { NavigationConfigsProvider } from '@rbx/creator-hub-navigation';

export default function getNavigationEnvironment(): React.ComponentProps<
  typeof NavigationConfigsProvider
>['environment'] {
  if (process.env.targetEnvironment === 'production') {
    return 'production';
  }

  if (process.env.targetEnvironment === 'sitetest1') {
    return 'staging';
  }

  return 'development';
}

import type { FunctionComponent, PropsWithChildren } from 'react';
import dynamic from 'next/dynamic';
import { UniversalFeatureRestrictionsProvider as BaseUniversalFeatureRestrictionsProvider } from '@rbx/universal-feature-restrictions';

const UniversalFeatureRestrictionsSurface = dynamic(
  () => import('../components/UniversalFeatureRestrictionsSurface'),
  { ssr: false },
);

/**
 * Wrapper provider for the UniversalFeatureRestrictionsProvider from @rbx/universal-feature-restrictions
 * to hold additional logic such as the dynamic import of the UniversalFeatureRestrictionsSurface component.
 */
const UniversalFeatureRestrictionsProvider: FunctionComponent<PropsWithChildren> = ({
  children,
}) => (
  <BaseUniversalFeatureRestrictionsProvider Surface={UniversalFeatureRestrictionsSurface}>
    {children}
  </BaseUniversalFeatureRestrictionsProvider>
);

export default UniversalFeatureRestrictionsProvider;

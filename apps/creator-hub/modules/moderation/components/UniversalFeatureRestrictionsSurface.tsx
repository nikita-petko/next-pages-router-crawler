import { withTranslation } from '@rbx/intl';
import {
  translationConfig,
  type UniversalFeatureRestrictionsSurfaceProps,
} from '@rbx/universal-feature-restrictions';
import { UniversalFeatureRestrictionDialog } from '@rbx/universal-feature-restrictions/dialog';
import useUniversalFeatureRestrictionsConfig from '../hooks/useUniversalFeatureRestrictionsConfig';

/**
 * Intermediate wrapper for the UniversalFeatureRestrictionDialog component that provides the
 * required configuration. Used as a boundary between the UniversalFeatureRestrictionsProvider
 * so that the dialog can be lazily loaded.
 */
const UniversalFeatureRestrictionsSurface = (props: UniversalFeatureRestrictionsSurfaceProps) => {
  const config = useUniversalFeatureRestrictionsConfig();
  return <UniversalFeatureRestrictionDialog config={config} {...props} />;
};

export default withTranslation(UniversalFeatureRestrictionsSurface, translationConfig);

import type { FunctionComponent } from 'react';
import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import type Feature from '@modules/navigation/feature/interfaces/Feature';
import LeftNavigationMenuV2, {
  type TMenuItem,
} from '@modules/navigation/leftNavigation/components/LeftNavigationMenuV2';
import useIpFeatures from '../hooks/useIpFeatures';
import type { IpSettings } from '../types';

const IpIALeftNav: FunctionComponent = () => {
  const { translate } = useTranslation();
  const { features, activeFeature, defaultExpanded } = useIpFeatures(true);

  const menuItems = useMemo(() => {
    const featureToMenuItem = (feature: Feature<IpSettings>): TMenuItem => ({
      key: feature.key,
      label: translate(feature.nameKey),
      href: feature.path,
      subItems: feature.subFeatures?.map(featureToMenuItem),
    });
    return features.map(featureToMenuItem);
  }, [features, translate]);

  return (
    menuItems.length > 0 && (
      <LeftNavigationMenuV2
        defaultExpanded={defaultExpanded}
        header={translate('Heading.IP')}
        activeKey={activeFeature?.key}
        items={menuItems}
      />
    )
  );
};

export default IpIALeftNav;

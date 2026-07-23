import React, { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import IpBreadcrumbs, { Props } from '../../components/IpBreadcrumbs';
import { IP_FAMILIES_HREF } from '../urls';

/**
 * Breadcrumbs for IP families pages
 */
const IpFamiliesBreadcrumbs: React.FC<Props> = ({ pages }) => {
  const { translate } = useTranslation();

  const pagesWithRoot = useMemo(
    () => [{ title: translate('Heading.IPLibrary'), href: IP_FAMILIES_HREF }, ...pages],
    [pages, translate],
  );

  return <IpBreadcrumbs pages={pagesWithRoot} />;
};

export default IpFamiliesBreadcrumbs;

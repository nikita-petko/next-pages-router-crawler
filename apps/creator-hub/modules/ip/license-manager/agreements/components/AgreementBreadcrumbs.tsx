import React, { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import type { Props } from '../../../components/IpBreadcrumbs';
import IpBreadcrumbs from '../../../components/IpBreadcrumbs';
import { AGREEMENTS_HREF } from '../../urls';

/**
 * Breadcrumbs for Agreements pages
 */
const AgreementBreadcrumbs: React.FC<Props> = ({ pages }) => {
  const { translate } = useTranslation();

  const pagesWithRoot = useMemo(
    () => [{ title: translate('Label.Agreements'), href: AGREEMENTS_HREF }, ...pages],
    [pages, translate],
  );

  return <IpBreadcrumbs pages={pagesWithRoot} />;
};

export default AgreementBreadcrumbs;

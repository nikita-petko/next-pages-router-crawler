import React, { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { AGREEMENTS_HREF } from '../../urls';
import IpBreadcrumbs, { Props } from '../../../components/IpBreadcrumbs';

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

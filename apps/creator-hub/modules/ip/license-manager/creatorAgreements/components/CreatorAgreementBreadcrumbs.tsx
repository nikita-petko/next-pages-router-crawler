import React, { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { CREATOR_AGREEMENTS_HREF } from '../../urls';
import IpBreadcrumbs, { Props } from '../../../components/IpBreadcrumbs';

/**
 * Breadcrumbs for Creator License Agreements pages
 * To Creators, License Agreements are short-handed to Licenses
 */
const CreatorAgreementBreadcrumbs: React.FC<Props> = ({ pages }) => {
  const { translate } = useTranslation();

  const pagesWithRoot = useMemo(
    () => [{ title: translate('Heading.Licenses'), href: CREATOR_AGREEMENTS_HREF }, ...pages],
    [pages, translate],
  );

  return <IpBreadcrumbs pages={pagesWithRoot} />;
};

export default CreatorAgreementBreadcrumbs;

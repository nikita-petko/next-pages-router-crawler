import React, { useMemo } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { IP_LISTINGS_HREF } from '../../urls';
import IpBreadcrumbs, { Props } from '../../../components/IpBreadcrumbs';

/**
 * Breadcrumbs for IP listings pages
 */
const IpListingsBreadcrumbs: React.FC<Props> = ({ pages }) => {
  const { translate } = useTranslation();

  const pagesWithRoot = useMemo(
    () => [{ title: translate('Label.MyLicenses'), href: IP_LISTINGS_HREF }, ...pages],
    [pages, translate],
  );

  return <IpBreadcrumbs pages={pagesWithRoot} />;
};

export default withTranslation(IpListingsBreadcrumbs, [TranslationNamespace.AgreementsManager]);

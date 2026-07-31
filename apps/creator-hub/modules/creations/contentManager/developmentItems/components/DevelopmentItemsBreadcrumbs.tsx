import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { Breadcrumbs, type TBreadcrumbItem } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const getQueryValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const buildCreationsHref = (groupId: string | undefined) => {
  const params = new URLSearchParams();
  if (groupId != null) {
    params.set('groupId', groupId);
  }
  const query = params.toString();
  return query.length > 0 ? `/dashboard/creations?${query}` : '/dashboard/creations';
};

const DevelopmentItemsBreadcrumbs = () => {
  const router = useRouter();
  const { translate } = useTranslation();
  const groupId = getQueryValue(router.query.groupId);

  const items = useMemo<TBreadcrumbItem[]>(
    () => [
      {
        label: translate('Heading.Creations'),
        href: buildCreationsHref(groupId),
      },
      {
        label: translate('Label.DevelopmentItems'),
      },
    ],
    [groupId, translate],
  );

  return (
    <Breadcrumbs
      ariaLabel={translate('Label.DevelopmentItems')}
      expansionAriaLabel={translate('Label.OpenOptions')}
      items={items}
    />
  );
};

export default withTranslation(DevelopmentItemsBreadcrumbs, [
  TranslationNamespace.Controls,
  TranslationNamespace.Creations,
  TranslationNamespace.Navigation,
]);

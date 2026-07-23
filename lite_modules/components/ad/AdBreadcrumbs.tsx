import { Breadcrumbs } from '@rbx/foundation-ui';
import { useRouter } from 'next/router';
import { FC } from 'react';

import Routes from '@constants/routes';

type AdBreadcrumbsProps = {
  leafBreadCrumbText: string;
};

const AdBreadcrumbs: FC<AdBreadcrumbsProps> = ({ leafBreadCrumbText }) => {
  const router = useRouter();
  return (
    <Breadcrumbs
      ariaLabel='breadcrumb'
      data-testid='breadcrumb'
      expansionAriaLabel='breadcrumb'
      items={[
        {
          href: Routes.CLASSIC,
          label: 'Manage Ads',
          onClick: (e) => {
            e.preventDefault();
            router.push(Routes.CLASSIC);
          },
        },
        { label: leafBreadCrumbText },
      ]}
    />
  );
};

export default AdBreadcrumbs;

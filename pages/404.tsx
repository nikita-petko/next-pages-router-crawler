import { useRouter } from 'next/router';
import { ReactNode } from 'react';

import CenteredCircularProgress from '@components/common/CenteredCircularProgress';
import Routes from '@constants/routes';

const get404PageLayout = (page: ReactNode) => page;

const PageNotFound = () => {
  const router = useRouter();

  router.push({
    pathname: Routes.HOME,
  });

  return <CenteredCircularProgress />;
};

PageNotFound.getPageLayout = get404PageLayout;

export default PageNotFound;

import { ReactElement, ReactNode } from 'react';

import HomeRedirectPage from '@components/common/HomeRedirectPage';

type PageWithLayout = {
  (): ReactElement;
  getPageLayout?: (page: ReactNode) => ReactNode;
};

const HomePage: PageWithLayout = () => <HomeRedirectPage />;

HomePage.getPageLayout = (page: ReactNode) => page;

export default HomePage;

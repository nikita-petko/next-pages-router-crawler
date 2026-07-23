import { createContext, useContext } from 'react';

import { defaultPageTitle } from '@constants/navigation';
import Page from '@type/navigation';

const defaultPage = {
  pageTitle: defaultPageTitle,
  setCurrentPageTitle: () => {
    /* default function, intentionally empty */
  },
};

const pageContext = createContext<Page>(defaultPage);

export const usePage = () => useContext(pageContext);

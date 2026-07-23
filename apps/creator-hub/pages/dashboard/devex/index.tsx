import { useMemo } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import LuobuDevexContainer from '@modules/devex/luobu/devex/components/Devex';
import DevexContainer from '@modules/devex/global/pageContainer/components/DevexContainer';
import { useSettings } from '@modules/settings';
import { PageLoading } from '@modules/miscellaneous/common';
import getFinanceLayout from '@modules/finance/getFinanceLayout';

const Devex: NextLayoutPage = () => {
  const { settings, isFetched } = useSettings();

  const content = useMemo(() => {
    if (process.env.buildTarget === 'global' && isFetched && settings.isUserEligibleForDevEx) {
      return <DevexContainer />;
    }
    if (process.env.buildTarget === 'luobu') {
      return <LuobuDevexContainer />;
    }
    return <PageLoading />;
  }, [isFetched, settings.isUserEligibleForDevEx]);

  return <Authenticated>{content}</Authenticated>;
};

Devex.getPageLayout = (page) => getFinanceLayout(page, { title: 'Label.DevEx' });

export default Devex;

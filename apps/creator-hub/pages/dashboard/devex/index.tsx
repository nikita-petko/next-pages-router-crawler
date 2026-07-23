import { useMemo } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import DevexContainer from '@modules/devex/global/pageContainer/components/DevexContainer';
import LuobuDevexContainer from '@modules/devex/luobu/devex/components/Devex';
import getFinanceLayout from '@modules/finance/getFinanceLayout';
import { PageLoading } from '@modules/miscellaneous/components';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';

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

Devex.getPageLayout = (page) =>
  getFinanceLayout(page, {
    title: <Translate namespace='CreatorDashboard.Features' translationKey='Label.DevEx' />,
  });
Devex.loggerConfig = { rosId: RosTeams.PaymentsAndFraud };

export default Devex;

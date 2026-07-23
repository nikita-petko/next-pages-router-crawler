import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { StatusCodes } from '@rbx/core';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import LuobuCashOutContainer from '@modules/devex/luobu/cashOut/components/CashOut';
import { ErrorPage } from '@modules/miscellaneous/error';

const getCashOutPageLayout = (page: ReactNode) => (
  <CreatorHubLayout
    title={<Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.DevEx' />}>
    {page}
  </CreatorHubLayout>
);

const CashOut: NextLayoutPage = () => {
  if (process.env.buildTarget === 'luobu') {
    return (
      <Authenticated>
        <LuobuCashOutContainer />
      </Authenticated>
    );
  }
  return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
};

CashOut.getPageLayout = getCashOutPageLayout;
CashOut.loggerConfig = { rosId: RosTeams.PaymentsAndFraud };

export default CashOut;
